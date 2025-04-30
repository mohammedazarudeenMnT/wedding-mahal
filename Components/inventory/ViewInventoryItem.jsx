"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "../../hooks/usePagePermission";
import { motion } from "framer-motion";

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function ViewInventoryItem({ itemId }) {
  const hasViewPermission = usePagePermission("Inventory", "view");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/inventory/${itemId}`);
        if (response.data.success) {
          setItem(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  if (!hasViewPermission) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-red-500"
      >
        You don&apos;t have permission to view inventory items
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonLoader />
      </div>
    );
  }

  if (!item) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-gray-500"
      >
        Item not found
      </motion.div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-6 bg-content1 rounded-large shadow-small"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl md:text-2xl text-hotel-primary-text font-semibold">
          Item Details
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {[
            { label: "Supplier Name", value: item.supplierName },
            { label: "Category", value: item.category },
            { label: "Sub Category", value: item.subCategory },
            { label: "Brand Name", value: item.brandName },
            { label: "Model", value: item.model },
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-3 rounded-md"
            >
              <h2 className="text-sm font-semibold text-gray-600">
                {field.label}
              </h2>
              <p className="mt-1 text-gray-800">{field.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { label: "Price", value: `₹${item.price}` },
            { label: "GST", value: `${item.gst}%` },
            { label: "Quantity in Stock", value: item.quantityInStock },
            { label: "Status", value: item.status },
            { label: "Low Quantity Alert", value: item.lowQuantityAlert },
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 p-3 rounded-md"
            >
              <h2 className="text-sm font-semibold text-gray-600">
                {field.label}
              </h2>
              <p className="mt-1 text-gray-800">{field.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gray-50 p-3 rounded-md"
      >
        <h2 className="text-sm font-semibold text-gray-600">Description</h2>
        <p className="mt-2 text-gray-800">
          {item.description || "No description available"}
        </p>
      </motion.div>
    </motion.section>
  );
}
