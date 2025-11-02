import React from 'react';

function Contact() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-primary">Contact Warden</h1>
      <p className="mt-4 text-muted-foreground">
        For queries, assistance, or emergencies, please reach out.
      </p>

      <div className="mt-6 space-y-2">
        <p><strong>Email:</strong> warden@militaryhostel.gov</p>
        <p><strong>Phone:</strong> +91 98765 43210</p>
        <p><strong>Office Hours:</strong> 9:00 AM – 6:00 PM</p>
      </div>
    </div>
  );
}

export default Contact;
