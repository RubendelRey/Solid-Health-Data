import "./Home.css";

const Home = () => {
	return (
		<div className="home-container">
			<div className="hero-section">
				<div className="clinic-branding">
					<div className="logo-container">
						<svg
							className="clinic-logo"
							viewBox="0 0 100 100"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M50 15C35 15 25 25 25 40C25 55 35 75 45 85C47 87 50 90 50 90C50 90 53 87 55 85C65 75 75 55 75 40C75 25 65 15 50 15Z"
								fill="#0066CC"
								stroke="#003D7A"
								strokeWidth="2"
							/>
							<circle cx="40" cy="35" r="3" fill="white" />
							<circle cx="60" cy="35" r="3" fill="white" />
							<path
								d="M35 50C35 50 42 55 50 55C58 55 65 50 65 50"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</div>

					<h1 className="clinic-name">DentalCare Clinic</h1>

					<p className="clinic-tagline">Your Smile, Our Priority</p>
				</div>

				<div className="clinic-description">
					<h2>Welcome to DentalCare Clinic</h2>
					<p>
						At DentalCare Clinic, we are committed to providing exceptional
						dental care in a comfortable and modern environment. Our team of
						experienced professionals uses the latest technology and techniques
						to ensure you receive the best possible treatment for all your
						dental needs.
					</p>

					<div className="services-preview">
						<h3>Our Services Include:</h3>
						<ul>
							<li>General Dentistry</li>
							<li>Cosmetic Dentistry</li>
							<li>Orthodontics</li>
							<li>Oral Surgery</li>
							<li>Pediatric Dentistry</li>
							<li>Emergency Dental Care</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
