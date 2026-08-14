"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import ReviewSorting from "./reviews/ReviewSorting";
import ProductReviewForm from "./reviews/ProductReviewForm";
import { getProductReviews } from "@/services/review/review.service";
import { useToast } from "@/components/common/ToastContext";
import styles from "./reviews/ProductReviewModal.module.css";

const emptyBreakdown = {
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0,
};

const formatDate = (value) => {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const errorMessage = (error, fallback) =>
  typeof error === "string" ? error : error?.message || fallback;

const StarRating = ({ rating = 0 }) => {
  const rounded = Math.round(Number(rating) || 0);

  return (
    <div className="list-star">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className="icon icon-star"
          style={{ opacity: star <= rounded ? 1 : 0.25 }}
        />
      ))}
    </div>
  );
};

export default function Reviews({ product }) {
  const productId = product?._id || product?.id;
  const currentUser = useSelector((state) => state.auth.user);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    average: Number(product?.rating || 0),
    total: Number(product?.reviewsCount || 0),
    breakdown: emptyBreakdown,
  });
  const [sort, setSort] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [isModalMounted, setIsModalMounted] = useState(false);
  const reviewModalId = useMemo(
    () =>
      `product-review-modal-${String(productId || "product").replace(
        /[^a-zA-Z0-9_-]/g,
        "-",
      )}`,
    [productId],
  );

  useEffect(() => {
    setIsModalMounted(true);
  }, []);

  const reviewSchema = useMemo(() => {
    if (!productId) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product?.title,
      image: product?.images || product?.slideItems?.map((item) => item.src),
      description: product?.description,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(summary.average || 0),
        reviewCount: Number(summary.total || 0),
      },
      review: reviews.slice(0, 10).map((review) => ({
        "@type": "Review",
        name: review.title || "Customer review",
        reviewBody: review.comment,
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: review.authorName,
        },
        datePublished: review.createdAt,
      })),
    };
  }, [product, productId, reviews, summary]);

  const loadReviews = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);

    try {
      const response = await getProductReviews(productId, {
        limit: 20,
        sort,
      });
      setReviews(response.data || []);
      setSummary({
        average: Number(response.meta?.summary?.average || 0),
        total: Number(response.meta?.summary?.total || 0),
        breakdown: {
          ...emptyBreakdown,
          ...(response.meta?.summary?.breakdown || {}),
        },
      });
    } catch (err) {
      toast(errorMessage(err, "Unable to load reviews right now."), "error");
    } finally {
      setIsLoading(false);
    }
  }, [productId, sort, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (typeof window === "undefined" || !productId) return undefined;

    const handleReviewsUpdated = (event) => {
      if (String(event.detail?.productId) === String(productId)) {
        loadReviews();
      }
    };

    window.addEventListener("product-reviews-updated", handleReviewsUpdated);
    return () =>
      window.removeEventListener("product-reviews-updated", handleReviewsUpdated);
  }, [loadReviews, productId]);

  const totalReviews = Number(summary.total || reviews.length || 0);
  const averageRating = Number(summary.average || product?.rating || 0);
  const reviewCountLabel = pluralize(totalReviews, "Review");
  const reviewModal = (
    <div
      className={`modal fade ${styles.reviewModal}`}
      id={reviewModalId}
      tabIndex={-1}
      aria-labelledby={`${reviewModalId}-title`}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className={styles.reviewModalHeader}>
            <div>
              <p className={styles.reviewModalEyebrow}>Customer feedback</p>
              <h4 className={styles.reviewModalTitle} id={`${reviewModalId}-title`}>
                Write a review
              </h4>
            </div>
            <button
              className={styles.reviewModalClose}
              type="button"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span className="icon-close" aria-hidden="true" />
            </button>
          </div>
          <div className={styles.reviewModalBody}>
            <div className={styles.reviewModalForm}>
              <ProductReviewForm
                product={product}
                user={currentUser}
                onSubmitted={loadReviews}
                showTitle={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
      )}
      <div className="tab-reviews-heading">
        <div className="top">
          <div className="text-center">
            <div className="number title-display">
              {averageRating ? averageRating.toFixed(1) : "0.0"}
            </div>
            <StarRating rating={averageRating} />
            <p>({pluralize(totalReviews, "Rating")})</p>
          </div>
          <div className="rating-score">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = Number(summary.breakdown?.[rating] || 0);
              const width = totalReviews ? (count / totalReviews) * 100 : 0;

              return (
                <div className="item" key={rating}>
                  <div className="number-1 text-caption-1">{rating}</div>
                  <i className="icon icon-star" />
                  <div className="line-bg">
                    <div style={{ width: `${width}%` }} />
                  </div>
                  <div className="number-2 text-caption-1">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="reply-comment style-1 cancel-review-wrap">
        <div className="d-flex mb_24 gap-20 align-items-center justify-content-between flex-wrap">
          <h4>{reviewCountLabel}</h4>
          <div className="d-flex align-items-center gap-12 flex-wrap">
            {currentUser && (
              <button
                className="btn-style-4 text-btn-uppercase letter-1"
                type="button"
                data-bs-toggle="modal"
                data-bs-target={`#${reviewModalId}`}
              >
                Post Review
              </button>
            )}
            <div className="text-caption-1">Sort by:</div>
            <ReviewSorting value={sort} onChange={setSort} />
          </div>
        </div>

        {isLoading ? (
          <p className="text-secondary">Loading customer reviews...</p>
        ) : reviews.length ? (
          <div className="reply-comment-wrap">
            {reviews.map((review) => (
              <div className="reply-comment-item" key={review._id}>
                <div className="user">
                  <div
                    className="image d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "#f3f3f3" }}
                  >
                    <span className="text-btn-uppercase">
                      {(review.authorName || "C").slice(0, 1)}
                    </span>
                  </div>
                  <div>
                    <h6>
                      <span className="link">
                        {review.title || "Customer review"}
                      </span>
                    </h6>
                    <div className="day text-secondary-2 text-caption-1">
                      {review.authorName} &nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;
                      {formatDate(review.createdAt)}
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <p className="text-secondary">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary">
            No reviews yet. Be the first customer to review this product.
          </p>
        )}
      </div>

      {isModalMounted && currentUser ? createPortal(reviewModal, document.body) : null}
    </>
  );
}
