import { Search, Link2, Mail, User, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface ProfileSearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function ProfileSearch({ onSearch, isLoading }: ProfileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"url" | "email" | "username">("url");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSearch();
    }
  };

  const detectSearchType = (value: string) => {
    if (value.includes("@")) {
      setSearchType("email");
    } else if (value.includes("http") || value.includes("www")) {
      setSearchType("url");
    } else {
      setSearchType("username");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    detectSearchType(value);
  };

  const getIcon = () => {
    switch (searchType) {
      case "email":
        return <Mail className="w-4 h-4 text-gray-400" />;
      case "url":
        return <Link2 className="w-4 h-4 text-gray-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200 shadow-xl">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
              Scan Digital Footprint
            </h3>
            <p className="text-sm text-gray-600">
              Enter a profile URL, email address, or username to analyze
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={searchType}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getIcon()}
                  </motion.div>
                </AnimatePresence>
              </div>
              <Input
                type="text"
                placeholder="https://twitter.com/username or email@example.com"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pl-10 pr-4 py-6 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors"
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Scan Profile
                  </>
                )}
              </Button>
            </motion.div>
          </div>


        </div>
      </Card>
    </motion.div>
  );
}
