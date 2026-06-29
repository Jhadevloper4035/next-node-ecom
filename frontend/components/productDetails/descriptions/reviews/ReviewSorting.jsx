import React, { useState } from "react";

const defaultOptions = [
  { label: "Most Recent", value: "newest" },
  { label: "Highest Rated", value: "highest" },
  { label: "Lowest Rated", value: "lowest" },
];

export default function ReviewSorting({
  options = defaultOptions,
  value,
  onChange,
}) {
  const firstOption = options[0] || defaultOptions[0];
  const selected = options.find((option) => option.value === value);
  const [selectedOption, setSelectedOption] = useState(
    selected?.label || firstOption.label,
  );

  const handleSelect = (option) => {
    setSelectedOption(option.label);
    onChange?.(option.value);
  };

  return (
    <div className="tf-dropdown-sort" data-bs-toggle="dropdown">
      <div className="btn-select">
        <span className="text-sort-value">{selectedOption}</span>
        <span className="icon icon-arrow-down" />
      </div>
      <div className="dropdown-menu">
        {options.map((option) => (
          <div
            key={option.value}
            className={`select-item ${
              selectedOption === option.label ? "active" : ""
            }`}
            onClick={() => handleSelect(option)}
          >
            <span className="text-value-item">{option.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
