package com.midnames.passportreader

import android.nfc.tech.IsoDep
import android.util.Log
import com.midnames.passportreader.models.PassportData
import com.midnames.passportreader.utils.NFCUtils
import org.jmrtd.PassportService
import org.jmrtd.lds.icao.COMFile
import org.jmrtd.lds.icao.DG15File
import org.jmrtd.lds.icao.DG1File

class PassportReader {
    private lateinit var passportService: PassportService
    private val TAG = "PassportReader"

    fun connectToNFC(isoDep: IsoDep) {
        try {
            Log.d(TAG, "Connecting to IsoDep...")
            isoDep.connect()
            Log.d(TAG, "Connected to IsoDep")
            passportService = NFCUtils.getPassportService(isoDep)
            Log.d(TAG, "Passport service created")
        } catch (e: Exception) {
            Log.e(TAG, "Error connecting to NFC", e)
            throw e
        }
    }


    @OptIn(ExperimentalStdlibApi::class)
    fun readPassport(
        documentNumber: String,
        dateOfBirth: String,
        dateOfExpiry: String,
        maxAttempts: Int = 3
    ): PassportData {
        var lastException: Exception? = null

        for (attempt in 1..maxAttempts) {
            try {
                Log.d(TAG, "Attempt $attempt of $maxAttempts")

                Log.d(TAG, "Creating BAC key...")
                val bacKey = NFCUtils.createBACKey(documentNumber, dateOfBirth, dateOfExpiry)

                Log.d(TAG, "Opening passport service...")
                passportService.open()

                Log.d(TAG, "Sending select applet...")
                passportService.sendSelectApplet(false)

                Log.d(TAG, "Performing BAC...")
                passportService.doBAC(bacKey)

                Log.d(TAG, "Reading DG1...")
                val dg1File = passportService.getInputStream(PassportService.EF_DG1).let { inputStream ->
                    DG1File(inputStream)
                }

                Log.d(TAG, "Reading COMFile...")
                val comfile = passportService.getInputStream(PassportService.EF_COM).let { inputStream ->
                    COMFile(inputStream)
                }

                Log.d(TAG, "Reading DG15...")
                val dg15File = passportService.getInputStream(PassportService.EF_DG15).let { inputStream ->
                    DG15File(inputStream)
                }

                val mrzInfo = dg1File.mrzInfo

                // convert date of birth and date of expiry to arrays of 3 integers. 341014 -> [34, 10, 14]
                val dob = dateOfBirth.chunked(2).map { it.toInt() }.toIntArray()
                val doe = dateOfExpiry.chunked(2).map { it.toInt() }.toIntArray()

                return PassportData(
                    documentNumber = mrzInfo.documentNumber,
                    dateOfBirth = dob,
                    dateOfExpiry = doe,
                    firstName = mrzInfo.secondaryIdentifier,
                    lastName = mrzInfo.primaryIdentifier,
                    nationality = mrzInfo.nationality,
                    gender = mrzInfo.gender.toString(),
                    issuingState = mrzInfo.issuingState,
                    pubkey = dg15File.encoded
                )



            } catch (e: Exception) {
                Log.e(TAG, "Error reading passport on attempt $attempt", e)
                lastException = e
                if (attempt < maxAttempts) {
                    // Wait a bit before retrying
                    Thread.sleep(100)
                    continue
                }
            }
        }

        throw lastException ?: Exception("Failed to read passport after $maxAttempts attempts")
    }

    fun isPassportValid(): Boolean {
        try {
            // Verify document signing
            val sodFile = passportService.getInputStream(PassportService.EF_SOD)
            // Implement document verification logic here
            return true
        } catch (e: Exception) {
            return false
        }
    }
}