"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  placeholder?: string
}

export function DateInput({
  value,
  onChange,
  error,
  required = false,
  className = "",
  placeholder = "DD/MM/YYYY",
}: DateInputProps) {
  const [inputValue, setInputValue] = useState("")
  const initializedRef = useRef(false)

  // Initialize from value prop - only on first render
  useEffect(() => {
    if (!initializedRef.current && value) {
      initializedRef.current = true
      setInputValue(formatDateString(value))
    }
  }, [value])

  // Format the date as the user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Remove any non-digit characters
    const digitsOnly = input.replace(/\D/g, "")

    // Format the date with slashes
    let formattedDate = ""

    if (digitsOnly.length > 0) {
      // Add day
      formattedDate = digitsOnly.substring(0, 2)

      // Add month
      if (digitsOnly.length > 2) {
        formattedDate += "/" + digitsOnly.substring(2, 4)
      }

      // Add year
      if (digitsOnly.length > 4) {
        formattedDate += "/" + digitsOnly.substring(4, 8)
      }
    }

    setInputValue(formattedDate)

    // Only call onChange when we have a complete date
    if (isValidDate(formattedDate)) {
      onChange(formattedDate)
    } else if (formattedDate === "") {
      onChange("")
    }
  }

  // Format a date string to dd/mm/yyyy
  const formatDateString = (dateStr: string): string => {
    // If it's already in the right format, return it
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr
    }

    // Try to parse as ISO date
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0")
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch (e) {
      // If parsing fails, return empty string
      return ""
    }

    return dateStr
  }

  // Validate the date format and check if it's a real date
  const isValidDate = (dateStr: string): boolean => {
    // Check format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return false
    }

    // Parse the date parts
    const parts = dateStr.split("/")
    const day = Number.parseInt(parts[0], 10)
    const month = Number.parseInt(parts[1], 10) - 1
    const year = Number.parseInt(parts[2], 10)

    // Create a date object and check if it's valid
    const date = new Date(year, month, day)

    // Check if the date is valid and the year is reasonable
    return (
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year &&
      year >= 1900 &&
      year <= new Date().getFullYear()
    )
  }

  return (
    <div className={className}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`premium-input ${error ? "border-red-500" : ""}`}
        maxLength={10} // DD/MM/YYYY = 10 characters
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
