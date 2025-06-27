export default class DataUtils {
	static getDoctorName(doctor) {
		if (!doctor) return "Unknown Doctor";
		return `${doctor.name[0]?.given[0]} ${doctor.name[0]?.family}`;
	}
	static getFirstName(doctor) {
		if (!doctor) return "Unknown";
		return doctor.name[0]?.given[0] || "Unknown";
	}
	static getLastName(doctor) {
		if (!doctor) return "Unknown";
		return doctor.name[0]?.family || "Unknown";
	}
	static getPatientName(patient) {
		if (!patient) return "Unknown Patient";
		return `${patient.name[0]?.given[0]} ${patient.name[0]?.family}`;
	}
}
