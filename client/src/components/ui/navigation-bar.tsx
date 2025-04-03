import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Trophy, 
  Search, 
  Menu, 
  X 
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NavigationBarProps {
  onSearch: (query: string) => void;
}

export function NavigationBar({ onSearch }: NavigationBarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    } else {
      toast({
        title: "Search Error",
        description: "Please enter a player name to search",
        variant: "destructive",
      });
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0C12] border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="h-12 w-auto mr-2">
                  <img 
                    src="/attached_assets/blox_piece_logo.png" 
                    alt="Blox Piece Logo" 
                    className="h-full object-contain"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-transparent bg-clip-text">
                  TIERS
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-gray-300 ml-8">
              <Link href="/">
                <a className={`flex items-center hover:text-white transition-colors ${location === "/" ? "text-white font-semibold" : ""}`}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </a>
              </Link>
              <Link href="/rankings">
                <a className={`flex items-center transition-colors ${location === "/rankings" ? "text-white font-semibold" : ""}`}>
                  <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                  Rankings
                </a>
              </Link>
              <a
                href="https://discord.gg/bloxfruits"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-white transition-colors group"
              >
                <FaDiscord className="mr-2 h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                Discord
              </a>
            </nav>
          </div>
          
          {/* Search Bar */}
          <div className="hidden md:block relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search player..."
                  className="bg-gray-800 text-gray-200 pl-10 border-gray-700 w-64 focus:ring-amber-500 focus:border-amber-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="text-gray-300"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-3">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search player..."
                  className="bg-gray-800 text-gray-200 pl-10 border-gray-700 w-full focus:ring-amber-500 focus:border-amber-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <nav className="flex flex-col space-y-3 text-gray-300">
              <Link href="/">
                <a className={`flex items-center py-2 hover:text-white ${location === "/" ? "text-white font-semibold" : ""}`} onClick={() => setIsMenuOpen(false)}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </a>
              </Link>
              <Link href="/rankings">
                <a className={`flex items-center py-2 hover:text-white ${location === "/rankings" ? "text-white font-semibold" : ""}`} onClick={() => setIsMenuOpen(false)}>
                  <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                  Rankings
                </a>
              </Link>
              <a
                href="https://discord.gg/bloxfruits"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center py-2 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaDiscord className="mr-2 h-4 w-4 text-indigo-400" />
                Discord
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
