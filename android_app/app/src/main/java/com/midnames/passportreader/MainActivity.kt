package com.midnames.passportreader

import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.constraintlayout.widget.ConstraintLayout
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.midnames.passportreader.models.PassportData
import com.midnames.passportreader.utils.NFCUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

private val TAG = "MainActivity"

class MainActivity : AppCompatActivity() {
    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private lateinit var passportReader: PassportReader
    private lateinit var sharedPreferences: SharedPreferences
    private var isReadyToScan = false
    private var isNfcEnabled = false

    // UI Components
    private lateinit var welcomeContainer: LinearLayout
    private lateinit var formContainer: LinearLayout
    private lateinit var scrollContainer: View
    private lateinit var scanContainer: ConstraintLayout

    private lateinit var etDocumentNumber: TextInputEditText
    private lateinit var etDateOfBirth: TextInputEditText
    private lateinit var etDateOfExpiry: TextInputEditText
    private lateinit var tvStatus: TextView
    private lateinit var tvPassportData: TextView
    private lateinit var etIPAddress: TextInputEditText
    private lateinit var btnScanPassport: Button
    private lateinit var btnCancelScan: Button
    private lateinit var btnScanAgain: Button
    private lateinit var tvScanStatus: TextView
    private lateinit var scanLine: View

    // Input layouts for animations
    private lateinit var tilDocumentNumber: TextInputLayout
    private lateinit var tilDateOfBirth: TextInputLayout
    private lateinit var tilDateOfExpiry: TextInputLayout
    private lateinit var tilIPAddress: TextInputLayout

    // Cards for animations
    private lateinit var statusCard: CardView
    private lateinit var passportDataCard: CardView

    // Digital ID Card Views
    private lateinit var cardPassportID: CardView
    private lateinit var tvCardName: TextView
    private lateinit var tvCardDocNumber: TextView
    private lateinit var tvCardNationality: TextView
    private lateinit var tvCardDOB: TextView
    private lateinit var tvCardGender: TextView
    private lateinit var tvCardExpiry: TextView
    private lateinit var tvCardIssuingState: TextView

    // Animation for status text
    private lateinit var blinkAnimation: AlphaAnimation
    private lateinit var fadeInAnimation: Animation
    private lateinit var scanLineAnimation: Animation

    private var ip = ""
    private var scanSuccessful = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize shared preferences
        sharedPreferences = getSharedPreferences("PassportReaderPrefs", Context.MODE_PRIVATE)

        // Initialize welcome container
        welcomeContainer = findViewById(R.id.welcomeContainer)
        formContainer = findViewById(R.id.formContainer)
        scrollContainer = findViewById(R.id.scrollContainer)
        scanContainer = findViewById(R.id.scanContainer)

        // Initialize form views
        etDocumentNumber = findViewById(R.id.etDocumentNumber)
        etDateOfBirth = findViewById(R.id.etDateOfBirth)
        etDateOfExpiry = findViewById(R.id.etDateOfExpiry)
        tvStatus = findViewById(R.id.tvStatus)
        tvPassportData = findViewById(R.id.tvPassportData)
        etIPAddress = findViewById(R.id.etIPAddress)
        btnScanPassport = findViewById(R.id.btnScanPassport)
        btnCancelScan = findViewById(R.id.btnCancelScan)
        btnScanAgain = findViewById(R.id.btnScanAgain)
        tvScanStatus = findViewById(R.id.tvScanStatus)
        scanLine = findViewById(R.id.scanLine)

        // Initialize input layouts
        tilDocumentNumber = findViewById(R.id.tilDocumentNumber)
        tilDateOfBirth = findViewById(R.id.tilDateOfBirth)
        tilDateOfExpiry = findViewById(R.id.tilDateOfExpiry)
        tilIPAddress = findViewById(R.id.tilIPAddress)

        // Initialize cards
        statusCard = findViewById(R.id.statusCard)
        passportDataCard = findViewById(R.id.passportDataCard)

        // Initialize Digital ID Card views
        cardPassportID = findViewById(R.id.cardPassportID)
        tvCardName = findViewById(R.id.tvCardName)
        tvCardDocNumber = findViewById(R.id.tvCardDocNumber)
        tvCardNationality = findViewById(R.id.tvCardNationality)
        tvCardDOB = findViewById(R.id.tvCardDOB)
        tvCardGender = findViewById(R.id.tvCardGender)
        tvCardExpiry = findViewById(R.id.tvCardExpiry)
        tvCardIssuingState = findViewById(R.id.tvCardIssuingState)

        // Setup animations
        setupAnimations()

        // Load saved server address
        loadSavedServerAddress()

        // Setup text change listeners for form validation
        setupFormValidation()

        // Setup button click listeners
        setupButtonListeners()

        // Start welcome transition with a simple delay
        showWelcomeScreen()

        // Initialize NFC
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        if (nfcAdapter == null) {
            updateStatus("$ error: NFC not available on this device")
            isNfcEnabled = false
            return
        } else {
            isNfcEnabled = true
        }

        pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        passportReader = PassportReader()

        // Set initial status with terminal-style prompt
        updateStatus("$ awaiting_passport_details...")
    }

    private fun setupAnimations() {
        // Setup blinking animation for status updates
        blinkAnimation = AlphaAnimation(1.0f, 0.5f).apply {
            duration = 500
            startOffset = 20
            repeatMode = Animation.REVERSE
            repeatCount = Animation.INFINITE
        }

        // Load fade in animation
        fadeInAnimation = AnimationUtils.loadAnimation(this, R.anim.fade_in)

        // Load scan line animation
        scanLineAnimation = AnimationUtils.loadAnimation(this, R.anim.scan_line_animation)
    }

    private fun loadSavedServerAddress() {
        // Load saved server address from SharedPreferences
        val savedAddress = sharedPreferences.getString("server_address", "")
        etIPAddress.setText(savedAddress)
    }

    private fun saveServerAddress(address: String) {
        // Save server address to SharedPreferences
        sharedPreferences.edit().putString("server_address", address).apply()
    }

    private fun setupFormValidation() {
        // Create a text watcher for form validation
        val formWatcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                validateForm()
            }
        }

        // Add text watchers to all required fields
        etDocumentNumber.addTextChangedListener(formWatcher)
        etDateOfBirth.addTextChangedListener(formWatcher)
        etDateOfExpiry.addTextChangedListener(formWatcher)

        // Add text watcher for server address to save it when changed
        etIPAddress.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                s?.toString()?.let { saveServerAddress(it) }
            }
        })

        // Initial validation
        validateForm()
    }

    private fun validateForm() {
        // Check if all required fields are filled
        val docNumber = etDocumentNumber.text.toString().trim()
        val dob = etDateOfBirth.text.toString().trim()
        val expiry = etDateOfExpiry.text.toString().trim()

        // Basic validation
        val isDocValid = docNumber.isNotEmpty()
        val isDobValid = dob.length == 6 && dob.all { it.isDigit() }
        val isExpiryValid = expiry.length == 6 && expiry.all { it.isDigit() }

        // Update button state
        isReadyToScan = isDocValid && isDobValid && isExpiryValid && isNfcEnabled
        btnScanPassport.isEnabled = isReadyToScan

        // Update button appearance
        btnScanPassport.alpha = if (isReadyToScan) 1.0f else 0.5f

        // Update status message
        if (!isReadyToScan) {
            val message = when {
                !isNfcEnabled -> "$ error: NFC not available on this device"
                !isDocValid -> "$ awaiting_input: Document number required"
                !isDobValid -> "$ awaiting_input: Valid date of birth required (YYMMDD)"
                !isExpiryValid -> "$ awaiting_input: Valid date of expiry required (YYMMDD)"
                else -> "$ awaiting_input: Please complete all fields"
            }
            updateStatus(message)
        } else {
            updateStatus("$ ready: Press 'Scan Passport' to continue")
        }
    }

    private fun setupButtonListeners() {
        // Scan passport button
        btnScanPassport.setOnClickListener {
            if (isReadyToScan) {
                // Save server address
                saveServerAddress(etIPAddress.text.toString())

                // Show scan screen
                showScanScreen()
            }
        }

        // Cancel scan button
        btnCancelScan.setOnClickListener {
            // Hide scan screen and return to form
            hideScanScreen()
        }

        // Scan Again button
        btnScanAgain.setOnClickListener {
            // Reset the UI to show input fields again
            resetToScanMode()
        }
    }

    private fun resetToScanMode() {
        // Show all input fields again
        tilDocumentNumber.visibility = View.VISIBLE
        tilDateOfBirth.visibility = View.VISIBLE
        tilDateOfExpiry.visibility = View.VISIBLE
        tilIPAddress.visibility = View.VISIBLE
        btnScanPassport.visibility = View.VISIBLE

        // Hide the scan again button
        btnScanAgain.visibility = View.GONE

        // Reset scan successful flag
        scanSuccessful = false

        // Clear the passport data fields
        tvPassportData.text = ""

        // Hide the ID card
        cardPassportID.visibility = View.GONE

        // Update status
        updateStatus("$ ready: Enter passport details to scan again")
    }

    private fun showScanScreen() {
        // Show the scan container with animation
        scrollContainer.visibility = View.GONE
        scanContainer.visibility = View.VISIBLE
        scanContainer.alpha = 0f
        scanContainer.animate()
            .alpha(1f)
            .setDuration(300)
            .start()

        // Start scan line animation
        scanLine.startAnimation(scanLineAnimation)

        // Update scan status
        tvScanStatus.text = "$ awaiting_passport: Please place your passport on the device"
        tvScanStatus.startAnimation(blinkAnimation)
    }

    private fun hideScanScreen() {
        // Hide the scan container and show the form
        tvScanStatus.clearAnimation()
        scanLine.clearAnimation()
        scanContainer.animate()
            .alpha(0f)
            .setDuration(300)
            .withEndAction {
                scanContainer.visibility = View.GONE
                scrollContainer.visibility = View.VISIBLE

                // If scan was successful, hide input fields and show only the ID card
                if (scanSuccessful) {
                    showOnlyCredential()
                }
            }
            .start()
    }

    private fun showOnlyCredential() {
        // Hide input fields and show only the credential card
        tilDocumentNumber.visibility = View.GONE
        tilDateOfBirth.visibility = View.GONE
        tilDateOfExpiry.visibility = View.GONE
        tilIPAddress.visibility = View.GONE
        btnScanPassport.visibility = View.GONE

        // Show a "Scan Again" button
        btnScanAgain.visibility = View.VISIBLE

        // Update status
        updateStatus("$ credential_ready: Digital passport credential created")
    }

    private fun showWelcomeScreen() {
        // Show welcome screen for 2 seconds then transition to form
        Handler(Looper.getMainLooper()).postDelayed({
            // Fade out welcome container
            welcomeContainer.animate()
                .alpha(0f)
                .setDuration(500)
                .withEndAction {
                    welcomeContainer.visibility = View.GONE

                    // Show form container with fade in
                    scrollContainer.visibility = View.VISIBLE
                    scrollContainer.alpha = 0f
                    scrollContainer.animate()
                        .alpha(1f)
                        .setDuration(500)
                        .start()
                }
                .start()
        }, 2000) // 2 seconds delay
    }

    override fun onResume() {
        super.onResume()
        if (isNfcEnabled) {
            nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
        }
    }

    override fun onPause() {
        super.onPause()
        if (isNfcEnabled) {
            nfcAdapter?.disableForegroundDispatch(this)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d(TAG, "onNewIntent called")

        // Only process NFC intents if we're on the scan screen
        if (scanContainer.visibility != View.VISIBLE) {
            return
        }

        if (NfcAdapter.ACTION_TECH_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_TAG_DISCOVERED == intent.action) {

            val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
            if (tag != null) {
                // First verify it's a passport
                if (!NFCUtils.isPassport(tag)) {
                    updateScanStatus("$ error: This doesn't appear to be a passport")
                    return
                }

                // Create IsoDep instance for verification
                var isoDep = IsoDep.get(tag)
                if (isoDep != null) {
                    // Verify ICAO applet
                    if (!NFCUtils.verifyICAOApplet(isoDep)) {
                        updateScanStatus("$ error: Not a valid ePassport")
                        return
                    }

                    // Create new IsoDep instance for reading
                    isoDep = IsoDep.get(tag)
                    if (isoDep != null) {
                        Log.d(TAG, "Valid ePassport detected")
                        readPassport(isoDep)
                    } else {
                        updateScanStatus("$ error: Cannot connect to passport chip")
                    }
                } else {
                    updateScanStatus("$ error: Cannot connect to passport chip")
                }
            } else {
                updateScanStatus("$ error: No NFC tag found")
            }
        }
    }

    private fun readPassport(isoDep: IsoDep) {
        val documentNumber = etDocumentNumber.text.toString()
        val dateOfBirth = etDateOfBirth.text.toString()
        val dateOfExpiry = etDateOfExpiry.text.toString()
        isoDep.timeout = 5000
        Log.d(TAG, "Starting passport read")
        Log.d(TAG, "Doc: $documentNumber, DOB: $dateOfBirth, Exp: $dateOfExpiry")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                withContext(Dispatchers.Main) {
                    updateScanStatus("$ reading_passport: Please hold the passport still...")
                }

                passportReader.connectToNFC(isoDep)

                withContext(Dispatchers.Main) {
                    updateScanStatus("$ connected: Keep holding steady...")
                }

                val passportData = passportReader.readPassport(
                    documentNumber,
                    dateOfBirth,
                    dateOfExpiry
                )

                withContext(Dispatchers.Main) {
                    tvScanStatus.clearAnimation()
                    updateScanStatus("$ success: Passport data read successfully")
                    scanSuccessful = true

                    // Return to main screen with data
                    Handler(Looper.getMainLooper()).postDelayed({
                        hideScanScreen()
                        displayPassportData(passportData)
                        displayDigitalIDCard(passportData)
                        sendToServer(passportData)
                        updateStatus("$ success: Passport data read successfully")
                    }, 1000)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reading passport", e)
                withContext(Dispatchers.Main) {
                    tvScanStatus.clearAnimation()
                    when {
                        e.message?.contains("Tag was lost") == true ->
                            updateScanStatus("$ error: Lost connection. Please keep the passport still and try again.")
                        e.message?.contains("BAC") == true ->
                            updateScanStatus("$ error: Authentication failed. Please check the passport details and try again.")
                        else ->
                            updateScanStatus("$ error: ${e.message}")
                    }
                }
            }
        }
    }

    private fun sendToServer(passportData: PassportData) {
        Log.d(TAG, "Sending passport data to server")
        updateStatus("$ sending_data: Transmitting to server...")
        tvStatus.startAnimation(blinkAnimation)

        // Get IP from input field
        ip = etIPAddress.text.toString()
        if (ip.isEmpty()) {
            updateStatus("$ error: Server address required")
            tvStatus.clearAnimation()
            return
        }

        val url = "https://${ip}/api/data"
        Log.d(TAG, "Server URL: $url")

        // Create a unique ID with timestamp
        val uniqueId = "read_${System.currentTimeMillis()}"

        // Get device IP address
        val deviceIp = "?"

        // Create JSON payload
        val jsonBody = JSONObject().apply {
            put("id", uniqueId)
            put("content", JSONObject().apply {
                put("type", "message")
                put("payload", JSONObject(passportData.toJson()))
            })
            put("source", JSONObject().apply {
                put("ip", deviceIp)
                put("device", "MidnamesApp")
            })
        }

        // For self-signed certificates, you need to trust them
        val trustAllCerts = getTrustManager()
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, trustAllCerts, SecureRandom())

        // Use Kotlin coroutines to perform network operation on background thread
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
                    .hostnameVerifier { _, _ -> true } // For self-signed certs
                    .build()

                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url(url)
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    withContext(Dispatchers.Main) {
                        tvStatus.clearAnimation()
                        if (response.isSuccessful) {
                            updateStatus("$ success: Data transmitted successfully")
                            Log.d(TAG, "Server response: ${response.body?.string()}")
                            showToast("Data sent successfully!")
                        } else {
                            updateStatus("$ error: Failed to send data. Code: ${response.code}")
                            Log.e(TAG, "Failed to send data. Error: ${response.code}")
                            showToast("Failed to send data: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStatus.clearAnimation()
                    updateStatus("$ error: Network error: ${e.message}")
                    Log.e(TAG, "Network error", e)
                    showToast("Network error: ${e.message}")
                }
            }
        }
    }

    private fun getTrustManager(): Array<TrustManager> {
        return arrayOf(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        })
    }

    private fun updateStatus(message: String) {
        tvStatus.text = message
    }

    private fun updateScanStatus(message: String) {
        tvScanStatus.text = message
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    private fun displayPassportData(passportData: PassportData) {
        val formattedData = """
            $ first_name: ${passportData.firstName}
            $ last_name: ${passportData.lastName}
            $ document_number: ${passportData.documentNumber}
            $ nationality: ${passportData.nationality}
            $ gender: ${passportData.gender}
            $ date_of_birth: ${passportData.dateOfBirth}
            $ date_of_expiry: ${passportData.dateOfExpiry}
            $ issuing_state: ${passportData.issuingState}
            $ pubkey_hash: ${passportData.pubkey.contentToString().take(32)}...
        """.trimIndent()

        tvPassportData.text = formattedData
    }

    private fun displayDigitalIDCard(passportData: PassportData) {
        // Format the name in uppercase for the ID card
        val fullName = "${passportData.firstName} ${passportData.lastName}".uppercase()

        // Convert IntArray to String for dates
        val dobString = intArrayToDateString(passportData.dateOfBirth)
        val expiryString = intArrayToDateString(passportData.dateOfExpiry)

        // Format dates for better readability
        val formattedDOB = formatDate(dobString)
        val formattedExpiry = formatDate(expiryString)

        // Populate the ID card fields
        tvCardName.text = fullName
        tvCardDocNumber.text = passportData.documentNumber
        tvCardNationality.text = passportData.nationality
        tvCardDOB.text = formattedDOB
        tvCardGender.text = passportData.gender
        tvCardExpiry.text = formattedExpiry
        tvCardIssuingState.text = passportData.issuingState

        // Show the ID card with animation
        cardPassportID.visibility = View.VISIBLE
        cardPassportID.alpha = 0f
        cardPassportID.animate()
            .alpha(1f)
            .setDuration(500)
            .start()
    }

    private fun intArrayToDateString(dateArray: IntArray): String {
        // Convert IntArray to YYMMDD format string
        if (dateArray.size >= 3) {
            val year = dateArray[0].toString().padStart(2, '0')
            val month = dateArray[1].toString().padStart(2, '0')
            val day = dateArray[2].toString().padStart(2, '0')
            return "$year$month$day"
        }
        return "000000" // Default if array is invalid
    }

    private fun formatDate(date: String): String {
        // Convert YYMMDD to YY-MM-DD
        return if (date.length == 6) {
            "${date.substring(0, 2)}-${date.substring(2, 4)}-${date.substring(4, 6)}"
        } else {
            date
        }
    }
}