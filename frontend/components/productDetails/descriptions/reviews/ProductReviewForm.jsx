"use client";
import React, { useMemo, useState } from "react";
import { createProductReview } from "@/services/review/review.service";

const initialForm = {
  title: "",
  comment: "",
  rating: 5,
};

const errorMessage = (error, fallback) =>
  typeof error === "string" ? error : error?.message || fallback;

const getReviewUser = (user) => ({
  name: user?.fullName || user?.name || "",
  email: user?.email || "",
});

export default function ProductReviewForm({
  product,
  user,
  onSubmitted,
  showTitle = true,
}) {
  const productId = product?._id || product?.id;
  const reviewUser = getReviewUser(user);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ratingInputName = useMemo(
    () => `product-review-rating-${productId || "product"}`,
    [productId],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productId || isSubmitting) return;

    if (!reviewUser.name || !reviewUser.email) {
      setError("Your account name and email are required to post a review.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      await createProductReview(productId, {
        ...form,
        authorName: reviewUser.name,
        authorEmail: reviewUser.email,
      });
      setForm(initialForm);
      setMessage("Thank you. Your review has been posted.");
      onSubmitted?.();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("product-reviews-updated", {
            detail: { productId },
          }),
        );
      }
    } catch (err) {
      setError(errorMessage(err, "Unable to post your review right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-write-review" onSubmit={handleSubmit}>
      <div className="heading">
        {showTitle && <h4>Write a review:</h4>}
        <div className="list-rating-check">
          {[5, 4, 3, 2, 1].map((rating) => (
            <React.Fragment key={rating}>
              <input
                type="radio"
                id={`${ratingInputName}-${rating}`}
                name="rating"
                value={rating}
                checked={form.rating === rating}
                onChange={handleChange}
              />
              <label htmlFor={`${ratingInputName}-${rating}`} title={`${rating} stars`} />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mb_32">
        <div className="mb_8">Review Title</div>
        <fieldset className="mb_20">
          <input
            type="text"
            placeholder="Give your review a title"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={120}
          />
        </fieldset>

        <div className="mb_8">Review</div>
        <fieldset className="d-flex mb_20">
          <textarea
            rows={4}
            placeholder="Write your comment here"
            name="comment"
            value={form.comment}
            onChange={handleChange}
            minLength={10}
            maxLength={1000}
            required
          />
        </fieldset>

        <div className="cols mb_20">
          <fieldset>
            <input
              type="text"
              placeholder="Your Name (Public)"
              name="authorName"
              value={reviewUser.name}
              minLength={2}
              maxLength={80}
              readOnly
              disabled
              required
            />
          </fieldset>
          <fieldset>
            <input
              type="email"
              placeholder="Your email (private)"
              name="authorEmail"
              value={reviewUser.email}
              readOnly
              disabled
              required
            />
          </fieldset>
        </div>
      </div>

      {message && <p className="text-secondary mb_12">{message}</p>}
      {error && <p className="text-secondary mb_12">{error}</p>}

      <div className="button-submit">
        <button className="text-btn-uppercase" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
