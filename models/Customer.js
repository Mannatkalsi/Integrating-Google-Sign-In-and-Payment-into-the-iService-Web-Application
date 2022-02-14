const mongoose = require("mongoose")
const validator = require("validator")
const passportlocalmongoose = require('passport-local-mongoose')
const customerSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true
        },

        firstname: {
            type: String,
            require: true
        },
        lastname: {
            type: String,
            require: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            validate(value) {
                if (validator.isEmail(value) != true) {
                    throw new Error('Email is not valid!')
                }
            }
        },
        password: {
            type: String,
            require: true,
            minlength: 8,
            validate(value) {
                if (this.confirmpass != value) {
                    throw new Error('Password does not match!')
                }
            }
        },

        confirmpass: {
            type: String,
            required: true,
            minlength: 8
        },
        mobile_number: {
            type: Number
        },
        googleId:{
            type: String,
        },
        passwordResetToken:{
            type: String,
        },
    }
)
customerSchema.plugin(passportlocalmongoose);

module.exports = mongoose.model("Customer", customerSchema)
