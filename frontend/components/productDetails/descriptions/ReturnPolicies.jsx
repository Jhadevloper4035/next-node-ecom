import React from "react";

export default function ReturnPolicies() {
  return (
    <>
      <div className="text-btn-uppercase mb_12">Return Policies</div>
      <p className="mb_12 text-secondary">
        At Curve &amp; Comfort, return and replacement requests are reviewed by
        our support team so we can resolve genuine delivery issues, product
        defects, and order mismatches fairly.
      </p>
      <div className="text-btn-uppercase mb_12">Eligible Returns</div>
      <ul className="list-text type-disc mb_12 gap-6">
        <li className="text-secondary font-2">
          Faulty, damaged, or non-operational products may qualify for return,
          replacement, or repair after inspection.
        </li>
        <li className="text-secondary font-2">
          If the delivered product does not match the product description or
          confirmed order, please raise a request with supporting photographs.
        </li>
        <li className="text-secondary font-2">
          Damage must be reported at the time of delivery or assembly. Damage
          caused after delivery, including relocation or misuse, is not covered.
        </li>
      </ul>
      <div className="text-btn-uppercase mb_12">Simple Process</div>
      <ul className="list-text type-number">
        <li className="text-secondary font-2">
          Contact Curve &amp; Comfort support with your order number, reason for
          return, and clear photos or videos of the product and packaging.
        </li>
        <li className="text-secondary font-2">
          Our team will review the request and may arrange a technician visit
          or ask for additional details before approving the return.
        </li>
        <li className="text-secondary font-2">
          Keep the original packaging, accessories, manuals, and documents
          ready. Items must be packed securely for pickup or return shipping.
        </li>
        <li className="text-secondary font-2">
          Once the returned item is received and inspected, eligible refunds are
          processed to the original payment method within 7-21 working days, or
          a replacement may be offered.
        </li>
      </ul>
      <p className="text-secondary font-2">
        Return shipping charges may apply unless the return is due to a damaged,
        defective, or incorrectly delivered product. Approval of all return and
        replacement requests remains at the discretion of Curve &amp; Comfort.
      </p>
    </>
  );
}
