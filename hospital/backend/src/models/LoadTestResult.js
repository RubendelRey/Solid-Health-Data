import mongoose from "mongoose";

const LoadTestResultSchema = new mongoose.Schema(
	{
		testSession: {
			type: String,
			required: true,
			index: true,
		},
		sessionStartTime: {
			type: Date,
			required: true,
			default: Date.now,
		},
		testNumber: {
			type: Number,
			required: true,
		},
		totalTests: {
			type: Number,
			required: true,
		},
		triplesCount: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			enum: ["success", "failed"],
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		uploadMetrics: {
			dataFile: {
				url: String,
				uploadTime: Number,
				size: Number,
				triplesCount: Number,
			},
			shapeFile: {
				url: String,
				uploadTime: Number,
				size: Number,
			},
			shapeMapFile: {
				url: String,
				uploadTime: Number,
				size: Number,
			},
			totalUploadTime: Number,
		},
		pathUsed: {
			type: String,
			required: true,
		},
		pathConfiguration: {
			baseFolder: String,
			subfolder: String,
			filePrefix: String,
		},
		message: {
			type: String,
			required: true,
		},
		errorDetails: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

LoadTestResultSchema.index({ testSession: 1, testNumber: 1 });
LoadTestResultSchema.index({ sessionStartTime: -1 });
LoadTestResultSchema.index({ status: 1 });
LoadTestResultSchema.index({ createdAt: -1 });

const LoadTestResult = mongoose.model("LoadTestResult", LoadTestResultSchema);

export default LoadTestResult;
