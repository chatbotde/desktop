import { useState, useRef } from 'react'

/**
 * Hook to manage scroll position in containers
 * 
 * @example
 * const { messagesContainerRef, scrollToBottom, isNearBottom } = useScrollManager()
 */
export function useScrollManager() {
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Show scroll to top button when scrolled up more than 200px from top
      setShowScrollToTop(scrollTop > 200);
      
      // Consider "near bottom" if within 100px or 90% of the way down
      const nearBottom = (scrollHeight - scrollTop - clientHeight) < 100 || scrollPercentage > 0.9;
      setIsNearBottom(nearBottom);
    }
  };

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return {
    showScrollToTop,
    isNearBottom,
    messagesContainerRef,
    messagesEndRef,
    handleScroll,
    scrollToTop,
    scrollToBottom
  }
}
