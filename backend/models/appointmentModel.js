import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    docId: {
        type: String,
        required: true
    },
    slotDate: {
        type: String,
        required: true
    },
    slotTime: {
        type: String,
        required: true
    },
    docData: {
        type: Object,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    payment: {
        type: Boolean,
        default: false
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    patientVisited: {
        type: Boolean,
        default: false
    },
    showToUser: {
        type: Boolean,
        default: true
    },
    showToDoctor: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure the model is registered only once
const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);

export default appointmentModel;
