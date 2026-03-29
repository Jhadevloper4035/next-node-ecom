"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

export default function ColorSelect({
  activeColor = "",
  setActiveColor,
  colorOptions: propsColorOptions,
}) {
  const selectedProduct = useSelector((state) => state.product.selectedProduct);
  const [activeColorDefault, setActiveColorDefault] = useState("");

  const [displayOptions, setDisplayOptions] = useState(propsColorOptions || []);

  useEffect(() => {
    if (propsColorOptions) {
      setDisplayOptions(propsColorOptions);
    } else {
      let mapped = [];

      // Try extracting colors from tags first (per user's new requirement)
      if (selectedProduct?.tags?.length > 0) {
        const colorTags = selectedProduct.tags
          .filter((tag) => typeof tag === "string" && tag.startsWith("color:"))
          .map((tag) => tag.split(":")[1].trim());

        if (colorTags.length > 0) {
          mapped = colorTags.map((c, i) => ({
            id: `tag-values-${c.toLowerCase().replace(/\s+/g, "-")}-${i}`,
            value: c,
            color: c.toLowerCase().replace(/\s+/g, "-"),
          }));
        }
      }

      // If no color tags found, fallback to selectedProduct.colors
      if (mapped.length === 0 && selectedProduct?.colors?.length > 0) {
        mapped = selectedProduct.colors.map((c, i) => {
          if (typeof c === "string") {
            return {
              id: `values-${c.toLowerCase().replace(/\s+/g, "-")}`,
              value: c,
              color: c.toLowerCase().replace(/\s+/g, "-"),
            };
          }
          const colorName =
            c.name ||
            c.value ||
            c.color ||
            c.bgColor?.replace("bg-", "") ||
            "Color";
          const colorValue =
            c.color ||
            c.bgColor?.replace("bg-", "") ||
            colorName.toLowerCase().replace(/\s+/g, "-");
          return {
            id: `values-${colorValue}-${i}`,
            value: colorName,
            color: colorValue,
          };
        });
      }

      if (mapped.length > 0) {
        setDisplayOptions(mapped);
        if (!activeColor && !activeColorDefault) {
          setActiveColorDefault(mapped[0].color);
        }
      } else {
        setDisplayOptions([]);
        setActiveColorDefault("");
      }
    }
  }, [propsColorOptions, selectedProduct, activeColor]);

  const handleSelectColor = (value) => {
    console.log(value);
    if (setActiveColor) {
      setActiveColor(value);
    } else {
      setActiveColorDefault(value);
    }
  };

  const currentActiveColor = activeColor || activeColorDefault;

  if (!displayOptions || displayOptions.length === 0) return null;

  return (
    <div className="variant-picker-item">
      <div className="variant-picker-label mb_12">
        Colors:
        <span
          className="text-title variant-picker-label-value value-currentColor"
          style={{ textTransform: "capitalize" }}
        >
          {currentActiveColor}
        </span>
      </div>
      <div className="ProductOptions_optionBox__DQu0b">
        {displayOptions.map(({ id, value, color }) => (
          <div key={id}>
            <label
              onClick={() => handleSelectColor(color)}
              className={`hover-tooltip tooltip-bot radius-60 color-btn ${
                currentActiveColor === color ? "active" : ""
              }`}
            >
              <span>{value}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
