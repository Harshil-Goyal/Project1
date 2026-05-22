import PolicyPageLayout from "../components/PolicyPageLayout";

const privacyIntro = [
  "This Privacy Policy explains how GS collects, uses, stores, and shares personal information when you use the Service.",
  "By using GS, you acknowledge the practices described in this policy and related legal notices.",
];

const privacySections = [
  {
    heading: "1. Information We Collect and Why",
    intro: "This section explains what information is collected and the reasons it is processed.",
    subsections: [
      {
        title: "1. Information We Collect",
        points: [
          "Account details such as username, email, and encrypted password.",
          "Profile information you choose to share.",
          "Messages, media, and content shared through the Service.",
          "Device, browser, usage, and log information including IP address.",
        ],
      },
      {
        title: "2. How We Use Information",
        points: [
          "To operate, maintain, and improve the Service.",
          "To authenticate users and secure accounts.",
          "To deliver messages and real-time communication features.",
          "To prevent abuse, fraud, and harmful activity.",
          "To provide support and policy updates.",
        ],
      },
      {
        title: "14. Data Accuracy and Updates",
        text: "You should keep account information accurate to support service quality and account recovery.",
      },
    ],
  },
  {
    heading: "2. Legal Bases, Consent, and Controls",
    intro: "This section outlines legal processing grounds and user controls.",
    subsections: [
      {
        title: "3. Legal Bases for Processing",
        text: "Where required by law, processing is based on contract performance, legal obligations, legitimate interests, and consent where applicable.",
      },
      {
        title: "7. Your Rights and Choices",
        points: [
          "You can update selected profile and account settings.",
          "You may request access, correction, or deletion where applicable.",
          "Some browser controls can limit cookies and similar technologies.",
        ],
      },
      {
        title: "12. Cookies and Similar Technologies",
        points: [
          "Essential cookies support authentication and security.",
          "Preference cookies remember selected settings.",
          "Analytics may help improve product performance.",
          "Disabling cookies may affect some features.",
        ],
      },
    ],
  },
  {
    heading: "3. Sharing, Transfers, and Third Parties",
    intro: "This section covers when information is shared and where it may be processed.",
    subsections: [
      {
        title: "4. Sharing of Information",
        points: [
          "With service providers supporting infrastructure, analytics, or security.",
          "With authorities where required by law.",
          "As part of merger, acquisition, or business transfer events.",
          "We do not sell your personal information.",
        ],
      },
      {
        title: "9. International Data Transfers",
        text: "Information may be processed outside your country with safeguards where required.",
      },
      {
        title: "18. Third-Party Links and Integrations",
        text: "External services have separate privacy terms and policies.",
      },
    ],
  },
  {
    heading: "4. Retention, Security, and Abuse Prevention",
    intro: "This section explains how data is retained and protected.",
    subsections: [
      {
        title: "5. Data Retention",
        text: "Data retention varies by purpose, legal obligations, and operational requirements.",
      },
      {
        title: "6. Data Security",
        text: "Reasonable administrative, technical, and organizational safeguards are applied, though no system is perfectly secure.",
      },
      {
        title: "16. Automated Processing",
        text: "Automated systems may be used to detect spam, fraud, and suspicious account behavior.",
      },
    ],
  },
  {
    heading: "5. Communications and Public Content",
    intro: "This section explains service communication and visibility of shared content.",
    subsections: [
      {
        title: "13. Communications and Notifications",
        text: "Service notices, security alerts, and account updates may be sent as needed. Marketing messages may include opt-out options.",
      },
      {
        title: "17. Public or Shared Spaces",
        text: "Content posted in public or broad channels may be visible based on your sharing settings.",
      },
    ],
  },
  {
    heading: "6. User Rights and Deletion Requests",
    intro: "This section describes rights requests and processing conditions.",
    subsections: [
      {
        title: "15. Deletion Requests",
        points: [
          "Deletion requests are handled where supported by law.",
          "Certain records may be retained for legal, fraud, or security reasons.",
          "Backups may persist temporarily during deletion workflows.",
        ],
      },
      {
        title: "19. Regional Privacy Rights",
        points: [
          "Depending on location, you may have rights to access, correct, or object to data processing.",
          "You may have complaint rights with a supervisory authority.",
          "Identity verification may be required for rights requests.",
        ],
      },
    ],
  },
  {
    heading: "7. Policy Updates, Children, and Contact",
    intro: "This section includes policy changes, age restrictions, interpretation, and contact details.",
    subsections: [
      {
        title: "8. Children's Privacy",
        text: "The Service is not intended for children below the legal minimum age in their jurisdiction.",
      },
      {
        title: "10. Changes to This Policy",
        text: "This policy may be updated over time with notice where required.",
      },
      {
        title: "11. Contact",
        text: "For privacy questions, contact support@yourchatapp.com.",
      },
      {
        title: "20. Policy Interpretation",
        text: "In case of translation differences, the primary service language version governs where legally permitted.",
      },
    ],
  },
];

function Privacy() {
  return (
    <PolicyPageLayout
      title="GS Privacy Policy"
      navbarTitle="Privacy Policy"
      subtitle="Please review how GS handles personal information."
      intro={privacyIntro}
      sections={privacySections}
    />
  );
}

export default Privacy;
