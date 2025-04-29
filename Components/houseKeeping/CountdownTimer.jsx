import React, { useState, useEffect } from 'react';
import { Chip } from "@nextui-org/react";

export default function CountdownTimer({ expectedEndTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(expectedEndTime).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setIsDelayed(true);
        return 'Overdue';
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m left`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    setTimeLeft(calculateTimeLeft()); // Initial calculation

    return () => clearInterval(timer);
  }, [expectedEndTime]);

  return (
    <Chip
      size="sm"
      color={isDelayed ? "danger" : "success"}
      variant="flat"
    >
      {timeLeft}
    </Chip>
  );
}
