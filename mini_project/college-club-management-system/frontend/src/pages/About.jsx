import { Link } from "react-router-dom";

const principles = [
  { number: "01", title: "Discover", text: "Find student communities that fit your interests, goals and campus life." },
  { number: "02", title: "Participate", text: "Explore event details and manage your registrations from one dashboard." },
  { number: "03", title: "Stay connected", text: "Keep up with club updates, announcements and membership decisions." },
];

function About() {
  return (
    <div className="about-page">
      <section className="page-hero">
        <div className="container py-5">
          <span className="eyebrow">ABOUT CLUBSPHERE</span>
          <div className="row align-items-end g-4 mt-1">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">Campus life, connected.</h1>
              <p className="lead text-secondary mb-0">ClubSphere brings clubs, events, membership requests and campus announcements into one straightforward experience.</p>
            </div>
            <div className="col-lg-4 text-lg-end"><Link to="/clubs" className="btn btn-primary btn-lg">Explore clubs</Link></div>
          </div>
        </div>
      </section>
      <section className="container py-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-5">
            <span className="eyebrow">OUR PURPOSE</span>
            <h2 className="section-title mt-2">Less coordination overhead. More campus participation.</h2>
          </div>
          <div className="col-lg-7">
            <p className="text-secondary fs-5">College communities work best when students can easily discover opportunities and organizers can coordinate activities with clear information. ClubSphere is designed to make those everyday interactions easier.</p>
            <p className="text-secondary mb-0">Students can browse clubs, request membership, register for events and review their activity. Coordinators and administrators can use role-based tools to review membership requests and keep campus information current.</p>
          </div>
        </div>
        <div className="row g-4 mt-4">
          {principles.map((item) => <div className="col-md-4" key={item.number}><article className="principle-card h-100"><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article></div>)}
        </div>
      </section>
    </div>
  );
}

export default About;
