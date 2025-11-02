 // src/pages/RuleBook.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/RuleBook.css'

const RuleBook = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const rules = [
    { title: "Academic Year", desc: "The academic year for admission will follow the official Education Department calendar." },
    { title: "Hostel Management Committee", desc: "A committee chaired by the District Collector will manage admissions and operations. Members include the District Sainik Welfare Officer and nominated representatives." },
    { title: "Hostel Admission Procedure", desc: "Admissions open after publication of results. Merit lists are prepared and displayed at the District Sainik Welfare Office. Candidates with failed exams are not eligible; misbehavior may lead to cancellation." },
    { title: "Priority Order", desc: "Priority is given to children of war widows and ex-servicemen, then students in professional courses, then merit-based applicants, then children of serving defense personnel." },
    { title: "Passed Students", desc: "Students who fail their qualifying exam will not be eligible for readmission." },
    { title: "Professional Courses Priority", desc: "Students in medicine, engineering, pharmacy, and similar professional courses will be prioritized." },
    { title: "If Applications are Less", desc: "If applications are fewer than capacity, remaining seats may be allocated to local students with District Collector approval." },
    { title: "Children of War Widows and Ex-Servicemen", desc: "Such candidates are given priority and will be considered for admission." },
    { title: "Preference", desc: "If seats remain vacant, children of other defense personnel may be considered." },
    { title: "School/College Hostels", desc: "If seats are available, students can be admitted to college/school hostels as appropriate." },
    { title: "Orphan Students", desc: "Children of deceased ex-servicemen and their widows will receive priority consideration." },
    { title: "Soldiers’ Widows", desc: "Widows of soldiers under 25 and who are working may be considered for admission." },
    { title: "Abandoned Widows", desc: "Abandoned widows and their daughters under 25 may be considered." },
    { title: "Students Definition", desc: "Children of ex-servicemen who are enrolled in recognized institutions will be considered as students." },
    { title: "Merit List", desc: "The District Sainik Welfare Office will prepare and publish the merit list for admission." },
    { title: "Job Restriction", desc: "Students residing in hostel are generally not permitted to engage in paid work while studying." },
    { title: "Mess Fees and Security Deposit", desc: "Mess charges and security deposits are set by the District Sainik Welfare Office. Fees are non-refundable if student leaves within two months." },
    { title: "Discipline Rules", desc: "Indiscipline, misbehavior, non-payment of mess charges or damage to hostel property are grounds for disciplinary action or expulsion." },
  ];

  // Roman numerals helper for headings
  const toRoman = (num) => {
    const romans = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];
    return romans[num - 1] || num;
  };

  const handleProceed = () => {
    if (!agreed) return;
    navigate("/application");
  };

  return (
    <div className="rulebook-container">
      <header className="rulebook-header">
        <h1>Hostel Rulebook</h1>
        <p>A guide to disciplined and harmonious community living.</p>
      </header>

      <main className="rulebook-main">
        {rules.map((rule, i) => (
          <article key={i} className="rule-item">
            <h2>
              <span className="gold-highlight">{toRoman(i + 1)}.</span>
              <span> {rule.title}</span>
            </h2>
            <p>{rule.desc}</p>
          </article>
        ))}

        <section className="agreement-box">
          <label htmlFor="agree">
            <input
              id="agree"
              type="checkbox"
              checked={agreed}
              onChange={() => setAgreed(v => !v)}
            />
            <div>
              <p>
                I have read, understood, and agree to abide by all the rules and regulations of the Army Daughters Hostel. I acknowledge that
                failure to comply may result in disciplinary action.
              </p>
              <p className="italic">
                When you submit your interest, our superintendent will contact you within 48 hours to confirm your booking.
              </p>
            </div>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleProceed}
              disabled={!agreed}
              aria-disabled={!agreed}
              className="proceed-btn"
            >
              Proceed to Application
            </button>

           
          </div>
        </section>
      </main>

      <footer className="rulebook-footer">
        <p>© {new Date().getFullYear()} Army Daughters Hostel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default RuleBook;
