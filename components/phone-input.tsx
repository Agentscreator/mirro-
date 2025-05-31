"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Comprehensive list of country codes
const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial_code: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dial_code: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dial_code: "+213", flag: "🇩🇿" },
  { name: "Andorra", code: "AD", dial_code: "+376", flag: "🇦🇩" },
  { name: "Angola", code: "AO", dial_code: "+244", flag: "🇦🇴" },
  { name: "Antigua and Barbuda", code: "AG", dial_code: "+1268", flag: "🇦🇬" },
  { name: "Argentina", code: "AR", dial_code: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dial_code: "+374", flag: "🇦🇲" },
  { name: "Australia", code: "AU", dial_code: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dial_code: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dial_code: "+994", flag: "🇦🇿" },
  { name: "Bahamas", code: "BS", dial_code: "+1242", flag: "🇧🇸" },
  { name: "Bahrain", code: "BH", dial_code: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dial_code: "+880", flag: "🇧🇩" },
  { name: "Barbados", code: "BB", dial_code: "+1246", flag: "🇧🇧" },
  { name: "Belarus", code: "BY", dial_code: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dial_code: "+32", flag: "🇧🇪" },
  { name: "Belize", code: "BZ", dial_code: "+501", flag: "🇧🇿" },
  { name: "Benin", code: "BJ", dial_code: "+229", flag: "🇧🇯" },
  { name: "Bhutan", code: "BT", dial_code: "+975", flag: "🇧🇹" },
  { name: "Bolivia", code: "BO", dial_code: "+591", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", code: "BA", dial_code: "+387", flag: "🇧🇦" },
  { name: "Botswana", code: "BW", dial_code: "+267", flag: "🇧🇼" },
  { name: "Brazil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
  { name: "Brunei", code: "BN", dial_code: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", code: "BG", dial_code: "+359", flag: "🇧🇬" },
  { name: "Burkina Faso", code: "BF", dial_code: "+226", flag: "🇧🇫" },
  { name: "Burundi", code: "BI", dial_code: "+257", flag: "🇧🇮" },
  { name: "Cambodia", code: "KH", dial_code: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dial_code: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dial_code: "+1", flag: "🇨🇦" },
  { name: "Cape Verde", code: "CV", dial_code: "+238", flag: "🇨🇻" },
  { name: "Central African Republic", code: "CF", dial_code: "+236", flag: "🇨🇫" },
  { name: "Chad", code: "TD", dial_code: "+235", flag: "🇹🇩" },
  { name: "Chile", code: "CL", dial_code: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dial_code: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dial_code: "+57", flag: "🇨🇴" },
  { name: "Comoros", code: "KM", dial_code: "+269", flag: "🇰🇲" },
  { name: "Congo", code: "CG", dial_code: "+242", flag: "🇨🇬" },
  { name: "Costa Rica", code: "CR", dial_code: "+506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dial_code: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dial_code: "+53", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", dial_code: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dial_code: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dial_code: "+45", flag: "🇩🇰" },
  { name: "Djibouti", code: "DJ", dial_code: "+253", flag: "🇩🇯" },
  { name: "Dominica", code: "DM", dial_code: "+1767", flag: "🇩🇲" },
  { name: "Dominican Republic", code: "DO", dial_code: "+1849", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dial_code: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dial_code: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dial_code: "+503", flag: "🇸🇻" },
  { name: "Equatorial Guinea", code: "GQ", dial_code: "+240", flag: "🇬🇶" },
  { name: "Eritrea", code: "ER", dial_code: "+291", flag: "🇪🇷" },
  { name: "Estonia", code: "EE", dial_code: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dial_code: "+251", flag: "🇪🇹" },
  { name: "Fiji", code: "FJ", dial_code: "+679", flag: "🇫🇯" },
  { name: "Finland", code: "FI", dial_code: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dial_code: "+33", flag: "🇫🇷" },
  { name: "Gabon", code: "GA", dial_code: "+241", flag: "🇬🇦" },
  { name: "Gambia", code: "GM", dial_code: "+220", flag: "🇬🇲" },
  { name: "Georgia", code: "GE", dial_code: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dial_code: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dial_code: "+233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dial_code: "+30", flag: "🇬🇷" },
  { name: "Grenada", code: "GD", dial_code: "+1473", flag: "🇬🇩" },
  { name: "Guatemala", code: "GT", dial_code: "+502", flag: "🇬🇹" },
  { name: "Guinea", code: "GN", dial_code: "+224", flag: "🇬🇳" },
  { name: "Guinea-Bissau", code: "GW", dial_code: "+245", flag: "🇬🇼" },
  { name: "Guyana", code: "GY", dial_code: "+592", flag: "🇬🇾" },
  { name: "Haiti", code: "HT", dial_code: "+509", flag: "🇭🇹" },
  { name: "Honduras", code: "HN", dial_code: "+504", flag: "🇭🇳" },
  { name: "Hungary", code: "HU", dial_code: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dial_code: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dial_code: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dial_code: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dial_code: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dial_code: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dial_code: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dial_code: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dial_code: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dial_code: "+1876", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dial_code: "+81", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", dial_code: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dial_code: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dial_code: "+254", flag: "🇰🇪" },
  { name: "Kiribati", code: "KI", dial_code: "+686", flag: "🇰🇮" },
  { name: "North Korea", code: "KP", dial_code: "+850", flag: "🇰🇵" },
  { name: "South Korea", code: "KR", dial_code: "+82", flag: "🇰🇷" },
  { name: "Kuwait", code: "KW", dial_code: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dial_code: "+996", flag: "🇰🇬" },
  { name: "Laos", code: "LA", dial_code: "+856", flag: "🇱🇦" },
  { name: "Latvia", code: "LV", dial_code: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dial_code: "+961", flag: "🇱🇧" },
  { name: "Lesotho", code: "LS", dial_code: "+266", flag: "🇱🇸" },
  { name: "Liberia", code: "LR", dial_code: "+231", flag: "🇱🇷" },
  { name: "Libya", code: "LY", dial_code: "+218", flag: "🇱🇾" },
  { name: "Liechtenstein", code: "LI", dial_code: "+423", flag: "🇱🇮" },
  { name: "Lithuania", code: "LT", dial_code: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dial_code: "+352", flag: "🇱🇺" },
  { name: "Macedonia", code: "MK", dial_code: "+389", flag: "🇲🇰" },
  { name: "Madagascar", code: "MG", dial_code: "+261", flag: "🇲🇬" },
  { name: "Malawi", code: "MW", dial_code: "+265", flag: "🇲🇼" },
  { name: "Malaysia", code: "MY", dial_code: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dial_code: "+960", flag: "🇲🇻" },
  { name: "Mali", code: "ML", dial_code: "+223", flag: "🇲🇱" },
  { name: "Malta", code: "MT", dial_code: "+356", flag: "🇲🇹" },
  { name: "Marshall Islands", code: "MH", dial_code: "+692", flag: "🇲🇭" },
  { name: "Mauritania", code: "MR", dial_code: "+222", flag: "🇲🇷" },
  { name: "Mauritius", code: "MU", dial_code: "+230", flag: "🇲🇺" },
  { name: "Mexico", code: "MX", dial_code: "+52", flag: "🇲🇽" },
  { name: "Micronesia", code: "FM", dial_code: "+691", flag: "🇫🇲" },
  { name: "Moldova", code: "MD", dial_code: "+373", flag: "🇲🇩" },
  { name: "Monaco", code: "MC", dial_code: "+377", flag: "🇲🇨" },
  { name: "Mongolia", code: "MN", dial_code: "+976", flag: "🇲🇳" },
  { name: "Montenegro", code: "ME", dial_code: "+382", flag: "🇲🇪" },
  { name: "Morocco", code: "MA", dial_code: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dial_code: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dial_code: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "NA", dial_code: "+264", flag: "🇳🇦" },
  { name: "Nauru", code: "NR", dial_code: "+674", flag: "🇳🇷" },
  { name: "Nepal", code: "NP", dial_code: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dial_code: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dial_code: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dial_code: "+505", flag: "🇳🇮" },
  { name: "Niger", code: "NE", dial_code: "+227", flag: "🇳🇪" },
  { name: "Nigeria", code: "NG", dial_code: "+234", flag: "🇳🇬" },
  { name: "Norway", code: "NO", dial_code: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dial_code: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dial_code: "+92", flag: "🇵🇰" },
  { name: "Palau", code: "PW", dial_code: "+680", flag: "🇵🇼" },
  { name: "Palestine", code: "PS", dial_code: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dial_code: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "PG", dial_code: "+675", flag: "🇵🇬" },
  { name: "Paraguay", code: "PY", dial_code: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dial_code: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dial_code: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dial_code: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial_code: "+351", flag: "🇵🇹" },
  { name: "Qatar", code: "QA", dial_code: "+974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dial_code: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dial_code: "+7", flag: "🇷🇺" },
  { name: "Rwanda", code: "RW", dial_code: "+250", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", code: "KN", dial_code: "+1869", flag: "🇰🇳" },
  { name: "Saint Lucia", code: "LC", dial_code: "+1758", flag: "🇱🇨" },
  { name: "Saint Vincent", code: "VC", dial_code: "+1784", flag: "🇻🇨" },
  { name: "Samoa", code: "WS", dial_code: "+685", flag: "🇼🇸" },
  { name: "San Marino", code: "SM", dial_code: "+378", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", code: "ST", dial_code: "+239", flag: "🇸🇹" },
  { name: "Saudi Arabia", code: "SA", dial_code: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dial_code: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dial_code: "+381", flag: "🇷🇸" },
  { name: "Seychelles", code: "SC", dial_code: "+248", flag: "🇸🇨" },
  { name: "Sierra Leone", code: "SL", dial_code: "+232", flag: "🇸🇱" },
  { name: "Singapore", code: "SG", dial_code: "+65", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", dial_code: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dial_code: "+386", flag: "🇸🇮" },
  { name: "Solomon Islands", code: "SB", dial_code: "+677", flag: "🇸🇧" },
  { name: "Somalia", code: "SO", dial_code: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dial_code: "+27", flag: "🇿🇦" },
  { name: "South Sudan", code: "SS", dial_code: "+211", flag: "🇸🇸" },
  { name: "Spain", code: "ES", dial_code: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dial_code: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dial_code: "+249", flag: "🇸🇩" },
  { name: "Suriname", code: "SR", dial_code: "+597", flag: "🇸🇷" },
  { name: "Swaziland", code: "SZ", dial_code: "+268", flag: "🇸🇿" },
  { name: "Sweden", code: "SE", dial_code: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dial_code: "+41", flag: "🇨🇭" },
  { name: "Syria", code: "SY", dial_code: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dial_code: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dial_code: "+992", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", dial_code: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dial_code: "+66", flag: "🇹🇭" },
  { name: "Togo", code: "TG", dial_code: "+228", flag: "🇹🇬" },
  { name: "Tonga", code: "TO", dial_code: "+676", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", code: "TT", dial_code: "+1868", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dial_code: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dial_code: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dial_code: "+993", flag: "🇹🇲" },
  { name: "Tuvalu", code: "TV", dial_code: "+688", flag: "🇹🇻" },
  { name: "Uganda", code: "UG", dial_code: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dial_code: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dial_code: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dial_code: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial_code: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dial_code: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dial_code: "+998", flag: "🇺🇿" },
  { name: "Vanuatu", code: "VU", dial_code: "+678", flag: "🇻🇺" },
  { name: "Vatican City", code: "VA", dial_code: "+379", flag: "🇻🇦" },
  { name: "Venezuela", code: "VE", dial_code: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dial_code: "+84", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", dial_code: "+967", flag: "🇾🇪" },
  { name: "Zambia", code: "ZM", dial_code: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dial_code: "+263", flag: "🇿🇼" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
}

export function PhoneInput({ value, onChange, error, required = false, className }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[0]>(
    COUNTRIES.find((c) => c.code === "US") || COUNTRIES[0],
  )
  const [phoneNumber, setPhoneNumber] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Initialize phone number from value prop - only on first render
  useEffect(() => {
    if (!initializedRef.current && value) {
      initializedRef.current = true

      // Try to match the country code from the value
      const matchedCountry = COUNTRIES.find((country) => value.startsWith(country.dial_code))

      if (matchedCountry) {
        setSelectedCountry(matchedCountry)
        setPhoneNumber(value.substring(matchedCountry.dial_code.length).trim())
      } else {
        setPhoneNumber(value)
      }
    }
  }, [value])

  // Handle phone number or country changes
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value
    setPhoneNumber(newPhoneNumber)

    // Call onChange with the combined value
    const combinedValue = `${selectedCountry.dial_code} ${newPhoneNumber}`.trim()
    onChange(combinedValue)
  }

  const handleCountryChange = (country: (typeof COUNTRIES)[0]) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchQuery("")

    // Call onChange with the combined value
    const combinedValue = `${country.dial_code} ${phoneNumber}`.trim()
    onChange(combinedValue)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredCountries = searchQuery
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dial_code.includes(searchQuery) ||
          country.code.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : COUNTRIES

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-1 rounded-full rounded-r-none border-r-0 bg-background/50 hover:bg-primary/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="mr-1">{selectedCountry.flag}</span>
            <span>{selectedCountry.dial_code}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {isOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl bg-background/90 p-2 shadow-lg backdrop-blur-md">
              <div className="relative mb-2">
                <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 rounded-full bg-background/50"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <div
                    key={country.code}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-primary/10"
                    onClick={() => handleCountryChange(country)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
                      <span className="text-xs text-muted-foreground">{country.dial_code}</span>
                    </div>
                    {country.code === selectedCountry.code && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder="Phone number"
          required={required}
          className={cn("rounded-l-none rounded-r-full bg-background/50", error ? "border-red-500" : "")}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
