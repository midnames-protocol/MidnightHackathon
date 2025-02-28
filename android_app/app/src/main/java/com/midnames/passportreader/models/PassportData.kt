package com.midnames.passportreader.models

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject

data class PassportData(
    val documentNumber: String,
    val dateOfBirth: IntArray,
    val dateOfExpiry: IntArray,
    val firstName: String,
    val lastName: String,
    val nationality: String,
    val gender: String,
    val issuingState: String,
    val pubkey: ByteArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as PassportData

        if (documentNumber != other.documentNumber) return false
        if (dateOfBirth != other.dateOfBirth) return false
        if (dateOfExpiry != other.dateOfExpiry) return false
        if (firstName != other.firstName) return false
        if (lastName != other.lastName) return false
        if (nationality != other.nationality) return false
        if (gender != other.gender) return false
        if (issuingState != other.issuingState) return false
        if (!pubkey.contentEquals(other.pubkey)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = documentNumber.hashCode()
        result = 31 * result + dateOfBirth.hashCode()
        result = 31 * result + dateOfExpiry.hashCode()
        result = 31 * result + firstName.hashCode()
        result = 31 * result + lastName.hashCode()
        result = 31 * result + nationality.hashCode()
        result = 31 * result + gender.hashCode()
        result = 31 * result + issuingState.hashCode()
        result = 31 * result + pubkey.contentHashCode()
        return result
    }

    fun toJson(): String {
        return JSONObject().apply {
            put("documentNumber", documentNumber)
            put("dateOfBirth", JSONArray(dateOfBirth.toList()))
            put("dateOfExpiry", JSONArray(dateOfExpiry.toList()))
            put("firstName", firstName)
            put("lastName", lastName)
            put("nationality", nationality)
            put("gender", gender)
            put("issuingState", issuingState)

            // Convert ByteArray to Base64 string for JSON compatibility
            put("pubkey", Base64.encodeToString(pubkey, Base64.DEFAULT))
        }.toString()
    }
}