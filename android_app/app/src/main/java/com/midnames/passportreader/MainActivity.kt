package com.midnames.passportreader

import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import android.app.PendingIntent
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Bundle
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.midnames.passportreader.models.PassportData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.util.Log
import com.midnames.passportreader.utils.NFCUtils
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

    private lateinit var etDocumentNumber: EditText
    private lateinit var etDateOfBirth: EditText
    private lateinit var etDateOfExpiry: EditText
    private lateinit var tvStatus: TextView
    private lateinit var tvPassportData: TextView
    private lateinit var etIPAddress: EditText
    private var ip = ""


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)


        // Initialize views
        etDocumentNumber = findViewById(R.id.etDocumentNumber)
        etDateOfBirth = findViewById(R.id.etDateOfBirth)
        etDateOfExpiry = findViewById(R.id.etDateOfExpiry)
        tvStatus = findViewById(R.id.tvStatus)
        tvPassportData = findViewById(R.id.tvPassportData)
        etIPAddress = findViewById(R.id.etIPAddress)

        // Initialize NFC
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        if (nfcAdapter == null) {
            updateStatus("NFC not available on this device")
            return
        }

        pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        passportReader = PassportReader()
    }
    override fun onResume() {
        super.onResume()
        nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        Log.d(TAG, "onNewIntent called")

        if (NfcAdapter.ACTION_TECH_DISCOVERED == intent.action ||
            NfcAdapter.ACTION_TAG_DISCOVERED == intent.action) {

            val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
            if (tag != null) {
                // First verify it's a passport
                if (!NFCUtils.isPassport(tag)) {
                    updateStatus("This doesn't appear to be a passport")
                    return
                }

                // Create IsoDep instance for verification
                var isoDep = IsoDep.get(tag)
                if (isoDep != null) {
                    // Verify ICAO applet
                    if (!NFCUtils.verifyICAOApplet(isoDep)) {
                        updateStatus("Not a valid ePassport")
                        return
                    }

                    // Create new IsoDep instance for reading
                    isoDep = IsoDep.get(tag)
                    if (isoDep != null) {
                        Log.d(TAG, "Valid ePassport detected")
                        readPassport(isoDep)
                    } else {
                        updateStatus("Error: Cannot connect to passport chip")
                    }
                } else {
                    updateStatus("Error: Cannot connect to passport chip")
                }
            } else {
                updateStatus("Error: No NFC tag found")
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
                    updateStatus("Please hold the passport still...")
                }

                passportReader.connectToNFC(isoDep)

                withContext(Dispatchers.Main) {
                    updateStatus("Connected! Keep holding steady...")
                }

                val passportData = passportReader.readPassport(
                    documentNumber,
                    dateOfBirth,
                    dateOfExpiry
                )

                withContext(Dispatchers.Main) {
                    updateStatus("Success! Passport data read.")
                    displayPassportData(passportData)
                    sendToServer(passportData)

                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reading passport", e)
                withContext(Dispatchers.Main) {
                    when {
                        e.message?.contains("Tag was lost") == true ->
                            updateStatus("Lost connection. Please keep the passport still and try again.")
                        e.message?.contains("BAC") == true ->
                            updateStatus("Authentication failed. Please check the passport details and try again.")
                        else ->
                            updateStatus("Error: ${e.message}")
                    }
                }
            }
        }
    }

    private fun sendToServer(passportData: PassportData) {
        Log.d(TAG, "Sending passport data to server")
        updateStatus("Sending passport data to server...")

        // Change http to https and update port if needed
        // get ip in the field         android:id="@+id/etIPAddress"

        ip = etIPAddress.text.toString()
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
                put("device", "App")
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
                    // Response handling same as before
                    if (response.isSuccessful) {
                        withContext(Dispatchers.Main) {
                            updateStatus("Data sent successfully!")
                            Log.d(TAG, "Server response: ${response.body?.string()}")
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            updateStatus("Failed to send data. Error: ${response.code}")
                            Log.e(TAG, "Failed to send data. Error: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    updateStatus("Network error: ${e.message}")
                    Log.e(TAG, "Network error", e)
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

    private fun displayPassportData(passportData: PassportData) {
        """
                First Name: ${passportData.firstName}
                Last Name: ${passportData.lastName}
                Document Number: ${passportData.documentNumber}
                Nationality: ${passportData.nationality}
                Gender: ${passportData.gender}
                Date of Birth: ${passportData.dateOfBirth}
                Date of Expiry: ${passportData.dateOfExpiry}
                Issuing State: ${passportData.issuingState}
                Public Key: ${passportData.pubkey.contentToString()}
            """.trimIndent().also { tvPassportData.text = it }
    }
}