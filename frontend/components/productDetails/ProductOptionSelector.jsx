"use client";

import React from "react";
import styles from "./ProductOptions.module.css";

/**
 * ProductOptionSelector
 * Renders a group of options as boxes with name and subtext (price/label).
 * 
 * @param {string} label - The group name (e.g., Size, Fabric)
 * @param {Array} options - Array of { id, name, subText }
 * @param {string} selectedValue - Currently selected option name
 * @param {function} onSelect - Callback when an option is clicked
 */
export default function ProductOptionSelector({ 
  label, 
  options = [], 
  selectedValue, 
  onSelect 
}) {
  if (!options || options.length === 0 || label.toLowerCase() === "size") return null;

  return (
    <div className={styles.optionGroup}>
      <div className={styles.labelWrapper}>
        <div className={styles.groupLabel}>{label}</div>
        <div className={styles.selectedLabel}>{selectedValue || "Select an option"}</div>
      </div>
      
      <div className={styles.optionsGrid}>
        {options.map((option) => (
          <div
            key={option.id || option.name}
            className={`${styles.optionBox} ${
              selectedValue === option.name ? styles.activeOption : ""
            }`}
            onClick={() => {
              if (label.toLowerCase() !== "size" && selectedValue === option.name) {
                onSelect("");
              } else {
                onSelect(option.name);
              }
            }}
          >
            <span className={styles.optionName}>{option.name}</span>
            <span className={styles.optionSub}>{option.subText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
