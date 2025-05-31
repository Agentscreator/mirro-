"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface AgeRangeSelectorProps {
  minAge: number
  maxAge: number
  onChange: (minAge: number, maxAge: number) => void
  className?: string
}

export function AgeRangeSelector({ minAge, maxAge, onChange, className }: AgeRangeSelectorProps) {
  const [range, setRange] = useState<[number, number]>([minAge, maxAge])

  useEffect(() => {
    setRange([minAge, maxAge])
  }, [minAge, maxAge])

  const handleChange = (values: number[]) => {
    const [min, max] = values as [number, number]
    setRange([min, max])
    onChange(min, max)
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <Label>Age Range</Label>
        <span className="text-sm text-muted-foreground">
          {range[0]} - {range[1]} years
        </span>
      </div>
      <Slider
        defaultValue={[minAge, maxAge]}
        value={range}
        min={13}
        max={100}
        step={1}
        onValueChange={handleChange}
        className="py-4"
      />
    </div>
  )
}
