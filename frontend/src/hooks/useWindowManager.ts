import { useState } from 'react'

interface DesktopSource {
  id: string
  name: string
  thumbnail: string
}

export function useWindowManager() {
  const [opacity, setOpacity] = useState([1])
  const [mouseIgnore, setMouseIgnore] = useState(false)
  const [desktopSources, setDesktopSources] = useState<DesktopSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [screenInfo, setScreenInfo] = useState<any>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [contentProtection, setContentProtection] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<'transparent' | 'black'>('transparent')
  const [showSettings, setShowSettings] = useState(false)

  const handleClose = () => {
    if (window.api?.closeWindow) {
      window.api.closeWindow()
    }
  }

  const handleMinimize = () => {
    if (window.api?.minimizeWindow) {
      window.api.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (window.api?.maximizeWindow) {
      window.api.maximizeWindow()
    }
  }

  const handleOpacityChange = (value: number[]) => {
    setOpacity(value)
    if (window.api?.setOpacity) {
      window.api.setOpacity(value[0])
    }
  }

  const handleMouseIgnoreToggle = async () => {
    if (window.api?.toggleMouseIgnore) {
      const newState = await window.api.toggleMouseIgnore()
      setMouseIgnore(newState)
    }
  }

  const handleGetDesktopSources = async () => {
    if (window.api?.getDesktopSources) {
      setIsCapturing(true)
      try {
        const sources = await window.api.getDesktopSources()
        setDesktopSources(sources)
        setShowSettings(true)
      } catch (error) {
        console.error('Error getting desktop sources:', error)
      } finally {
        setIsCapturing(false)
      }
    }
  }

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId)
    console.log('Selected source:', sourceId)
  }

  const handleContentProtectionToggle = async () => {
    if (window.api?.toggleContentProtection) {
      try {
        const newState = await window.api.toggleContentProtection()
        setContentProtection(newState)
        console.log('Content protection:', newState ? 'enabled' : 'disabled')
      } catch (error) {
        console.error('Error toggling content protection:', error)
      }
    }
  }

  const handleChatInputToggle = () => {
    if (window.api?.sendChatInputToggle) {
      window.api.sendChatInputToggle();
    }
  }

  return {
    opacity,
    mouseIgnore,
    desktopSources,
    selectedSource,
    screenInfo,
    isCapturing,
    contentProtection,
    currentTheme,
    showSettings,
    setScreenInfo,
    setContentProtection,
    setCurrentTheme,
    setShowSettings,
    handleClose,
    handleMinimize,
    handleMaximize,
    handleOpacityChange,
    handleMouseIgnoreToggle,
    handleGetDesktopSources,
    handleSourceSelect,
    handleContentProtectionToggle,
    handleChatInputToggle
  }
}
