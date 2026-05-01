import React, { useState, useEffect } from "react";
import axios from "../axios";
import { Icon } from "../components/icons";

const AdminPromotionalEmail = () => {
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);

  // Fetch newsletter subscribers
  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/admin/newsletter-subscribers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter only subscribed users
      const subscribed = (res.data.subscribers || []).filter(
        (s) => s.status === "subscribed",
      );
      setNewsletterSubscribers(subscribed);
    } catch (err) {
      console.error("Error fetching subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // Handle selecting all subscribers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails([]);
      setSelectAll(false);
    } else {
      setSelectedEmails(newsletterSubscribers.map((s) => s.email));
      setSelectAll(true);
    }
  };

  // Handle individual email selection
  const handleToggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email));
      setSelectAll(false);
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", text: "" });

    // Combine manually entered emails with selected subscribers
    let emailList = [...selectedEmails];

    // Parse comma-separated emails from input
    if (emails.trim()) {
      const parsedEmails = emails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@"));
      emailList = [...new Set([...emailList, ...parsedEmails])];
    }

    if (emailList.length === 0) {
      setStatus({
        type: "error",
        text: "Please enter email address(es) or select subscribers.",
      });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/auth/admin/promotional-email",
        {
          emails: emailList,
          subject: subject.trim(),
          message: message.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStatus({
        type: "success",
        text:
          res.data?.message ||
          `Email sent to ${emailList.length} recipient(s) successfully.`,
      });
      setMessage("");
      setEmails("");
      setSelectedEmails([]);
      setSelectAll(false);
    } catch (err) {
      setStatus({
        type: "error",
        text:
          err.response?.data?.message || "Could not send promotional email.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Promotional Email</h2>
        <p className="text-sm text-slate-500 mt-1">
          Send promotional email to users with unsubscribe link included in
          footer.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        {/* Newsletter Subscribers Selection */}
        {!loadingSubscribers && newsletterSubscribers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Newsletter Subscribers ({newsletterSubscribers.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-xl p-3 space-y-2">
              {newsletterSubscribers.map((subscriber) => (
                <label
                  key={subscriber._id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedEmails.includes(subscriber.email) || selectAll
                    }
                    onChange={() => handleToggleEmail(subscriber.email)}
                    className="w-4 h-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm text-slate-700">
                    {subscriber.email}
                  </span>
                </label>
              ))}
            </div>
            {selectedEmails.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {selectedEmails.length} recipient(s) selected
              </p>
            )}
          </div>
        )}

        {/* Manual Email Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Or Enter Emails (comma-separated)
          </label>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            placeholder="email1@example.com, email2@example.com"
          />
          <p className="text-xs text-slate-500 mt-1">
            Separate multiple emails with commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            placeholder="Special offer for you"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Message
          </label>
          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40 resize-y"
            placeholder="Enter promotional content here..."
            required
          />
        </div>

        {status.text ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {status.text}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon name="mail" className="w-4 h-4" />
          {sending ? "Sending..." : "Send Promotional Email"}
        </button>
      </form>
    </div>
  );
};

export default AdminPromotionalEmail;
