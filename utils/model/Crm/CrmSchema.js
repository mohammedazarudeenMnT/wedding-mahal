import mongoose from "mongoose";

const crmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        default: "",
    },
    mobileno: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

export default mongoose.models.Crm || mongoose.model("Crm", crmSchema);
