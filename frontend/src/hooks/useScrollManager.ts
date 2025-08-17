import { useState, useRef } from 'react'

export function useScrollManager() {
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (mainContentRef.current) {
      const scrollTop = mainContentRef.current.scrollTop;
      const scrollHeight = mainContentRef.current.scrollHeight;
      const clientHeight = mainContentRef.current.clientHeight;
      
      console.log('Scroll event:', { scrollTop, scrollHeight, clientHeight, canScroll: scrollHeight > clientHeight });
      setShowScrollToTop(scrollTop > 100);
    }
  };

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return {
    showScrollToTop,
    mainContentRef,
    handleScroll,
    scrollToTop
  }
}
