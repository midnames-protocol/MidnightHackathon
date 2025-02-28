package com.midnames.passportreader.utils

import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.util.Log
import org.jmrtd.BACKey
import org.jmrtd.PassportService
import net.sf.scuba.smartcards.CardService

class NFCUtils {
    companion object {
        private const val ICAO_AID = "A0000002471001"  // Standard AID for ePassports

        fun isPassport(tag: Tag): Boolean {
            // Check for required technologies
            val techList = tag.techList
            if (!techList.contains("android.nfc.tech.IsoDep")) {
                Log.d("NFCUtils", "Not a passport: Missing IsoDep")
                return false
            }

            // Check if it's an ISO 14443-4 (Type B) tag
            if (!techList.contains("android.nfc.tech.NfcB")) {
                Log.d("NFCUtils", "Not a passport: Missing NfcB")
                return false
            }

            return true
        }

        fun verifyICAOApplet(isoDep: IsoDep): Boolean {
            try {
                isoDep.connect()

                // Select ICAO applet
                val command = buildSelectAppletCommand(ICAO_AID)
                val response = isoDep.transceive(command)

                // Check response
                val isValid = response.size >= 2 &&
                        response[response.size - 2] == 0x90.toByte() &&
                        response[response.size - 1] == 0x00.toByte()

                // Disconnect after verification
                isoDep.close()

                return isValid
            } catch (e: Exception) {
                Log.e("NFCUtils", "Error verifying ICAO applet", e)
                try {
                    isoDep.close()
                } catch (ce: Exception) {
                    Log.e("NFCUtils", "Error closing IsoDep", ce)
                }
                return false
            }
        }

        private fun buildSelectAppletCommand(aid: String): ByteArray {
            val aidBytes = hexStringToByteArray(aid)
            return byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x0C.toByte()) +
                    byteArrayOf(aidBytes.size.toByte()) +
                    aidBytes
        }

        private fun hexStringToByteArray(s: String): ByteArray {
            val len = s.length
            val data = ByteArray(len / 2)
            var i = 0
            while (i < len) {
                data[i / 2] = ((Character.digit(s[i], 16) shl 4) + Character.digit(s[i + 1], 16)).toByte()
                i += 2
            }
            return data
        }

        fun createBACKey(
            documentNumber: String,
            dateOfBirth: String,
            dateOfExpiry: String
        ): BACKey {
            // Clean the inputs
            val cleanDocNumber = documentNumber.replace(" ", "")
            val cleanDateOfBirth = dateOfBirth.replace(" ", "")
            val cleanDateOfExpiry = dateOfExpiry.replace(" ", "")

            return BACKey(cleanDocNumber, cleanDateOfBirth, cleanDateOfExpiry)
        }

        fun getPassportService(isoDep: IsoDep): PassportService {
            val cardService = CardService.getInstance(isoDep)

            return PassportService(
                cardService,
                128, // Maximum tranceive length
                112, // Maximum block size
                false,
                false
            )
        }
    }
}