import PolicyPageLayout from "../components/PolicyPageLayout";

const termsIntro = [
  "These Terms of Service govern your access to and use of GS chat, website features, and related services.",
  "By creating an account or using the Service, you agree to these Terms and related policies.",
];

const termsSections = [
  {
    heading: "1. Account Access and Eligibility",
    intro: "This section explains who can use the Service and what account security responsibilities apply.",
    subsections: [
      {
        title: "1. Eligibility and Accounts",
        points: [
          "You must meet the minimum legal age in your region.",
          "You are responsible for maintaining account credential security.",
          "You are responsible for activity under your account.",
          "You must keep account information accurate and current.",
        ],
      },
      {
        title: "19. Account Security Responsibilities",
        points: [
          "Use a strong password and do not share credentials.",
          "Notify support if unauthorized access is suspected.",
          "Enable additional security controls where available.",
        ],
      },
    ],
  },
  {
    heading: "2. Community Conduct and User Content",
    intro: "This section defines acceptable use, content ownership, and moderation standards.",
    subsections: [
      {
        title: "2. Acceptable Use",
        intro: "You agree not to use the Service to:",
        points: [
          "Harass, threaten, abuse, or harm others.",
          "Share illegal, fraudulent, hateful, or defamatory content.",
          "Send malware, scams, spam, or unauthorized ads.",
          "Impersonate a person or organization.",
          "Attempt unauthorized access to systems or data.",
          "Interfere with platform reliability or performance.",
        ],
      },
      {
        title: "3. User Content",
        points: [
          "You retain ownership of submitted content.",
          "You grant a limited license for service operation and improvement.",
          "You are responsible for ensuring content complies with law and rights.",
        ],
      },
      {
        title: "4. Moderation and Enforcement",
        points: [
          "We may review reports and investigate misuse.",
          "We may remove content or restrict accounts for violations.",
          "We may cooperate with lawful authority requests.",
        ],
      },
    ],
  },
  {
    heading: "3. Service Operations and Platform Availability",
    intro: "This section covers service continuity and third-party dependencies.",
    subsections: [
      {
        title: "6. Service Availability",
        points: [
          "Service availability is targeted but not guaranteed to be uninterrupted.",
          "Features may be modified, suspended, or removed.",
          "Maintenance windows may temporarily limit access.",
        ],
      },
      {
        title: "7. Third-Party Services",
        text: "Some integrations or linked tools are provided by third parties. Their terms and practices are their own responsibility.",
      },
    ],
  },
  {
    heading: "4. Payments and Commercial Terms",
    intro: "This section explains billing, renewals, and refund handling for paid features.",
    subsections: [
      {
        title: "15. Payments and Subscriptions",
        points: [
          "Some features may require paid plans or subscriptions.",
          "Paid plans may auto-renew unless cancelled.",
          "Applicable taxes and fees remain your responsibility.",
          "Unpaid balances may lead to restricted premium access.",
        ],
      },
      {
        title: "16. Refund Policy",
        text: "Refund eligibility depends on applicable law, payment method, and plan terms shown at checkout.",
      },
    ],
  },
  {
    heading: "5. Legal Rights, Ownership, and Liability",
    intro: "This section describes intellectual property, disclaimers, liability limits, and indemnity.",
    subsections: [
      {
        title: "9. Disclaimers",
        text: 'The Service is provided on an "AS IS" and "AS AVAILABLE" basis, subject to applicable law.',
      },
      {
        title: "10. Limitation of Liability",
        text: "To the maximum extent permitted by law, we are not liable for indirect or consequential damages and similar losses.",
      },
      {
        title: "11. Indemnification",
        text: "You agree to indemnify the Service and operators from claims related to misuse, violations, or unlawful content.",
      },
      {
        title: "17. Intellectual Property",
        points: [
          "Service software, brand assets, and documentation are protected by law.",
          "Copying, reverse engineering, or derivative works are restricted unless legally permitted.",
          "No ownership transfer is granted by these Terms.",
        ],
      },
      {
        title: "18. Feedback and Suggestions",
        text: "If you submit ideas or suggestions, you grant a royalty-free right to use them to improve the Service.",
      },
    ],
  },
  {
    heading: "6. Privacy, Compliance, and Lawful Use",
    intro: "This section covers privacy commitments and legal compliance obligations.",
    subsections: [
      {
        title: "5. Privacy and Data",
        text: "Your use of the Service is also governed by the Privacy Policy and core data security practices.",
      },
      {
        title: "20. Export and Sanctions Compliance",
        text: "You must comply with applicable export control and sanctions laws and avoid prohibited uses.",
      },
    ],
  },
  {
    heading: "7. Termination and General Legal Terms",
    intro: "This section describes account closure, updates to terms, and contract framework rules.",
    subsections: [
      {
        title: "8. Termination",
        points: [
          "You can stop using the Service at any time.",
          "We may suspend or terminate access for violations or security risks.",
          "Rights to use the Service end upon termination.",
        ],
      },
      {
        title: "12. Changes to These Terms",
        text: "Terms may be updated over time, with notice where required.",
      },
      {
        title: "13. Governing Law",
        text: "These Terms are governed by the jurisdiction specified by the Service operator.",
      },
      {
        title: "14. Contact",
        text: "For terms questions, contact support@yourchatapp.com.",
      },
      {
        title: "21. Survival of Terms",
        text: "Clauses that should survive termination continue to apply after account closure.",
      },
      {
        title: "22. Entire Agreement",
        text: "These Terms and incorporated policies form the complete agreement for platform use.",
      },
      {
        title: "23. Severability and Waiver",
        text: "If one clause is unenforceable, remaining clauses continue in effect.",
      },
      {
        title: "24. Assignment",
        text: "User assignment is restricted; we may assign terms during merger or reorganization events.",
      },
    ],
  },
];

function Terms() {
  return (
    <PolicyPageLayout
      title="GS Terms of Service"
      navbarTitle="Terms of Service"
      subtitle="Please read these Terms carefully before using GS."
      intro={termsIntro}
      sections={termsSections}
    />
  );
}

export default Terms;
