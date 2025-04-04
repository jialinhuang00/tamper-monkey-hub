// ==UserScript==
// @name         YouTube Favorites Cleaner By Index
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically remove all videos from YouTube favorites list by targeting specific indexes
// @author       You
// @match        https://www.youtube.com/playlist?list=LL*
// @match        https://www.youtube.com/playlist?list=FLM*
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  // some global variables
  let isProcessing = false
  let processedCount = 0
  let totalVideos = 0
  let statusDisplay = null
  let currentIndex = 0

  // Remove existing buttons
  function removeExistingButtons() {
    const existingButton = document.getElementById('clear-all-favorites')
    const existingStatus = document.getElementById('clear-status')
    if (existingButton) existingButton.remove()
    if (existingStatus) existingStatus.remove()
  }

  // add a btn not belongs to youtube itself
  function addClearButton() {
    removeExistingButtons()

    const menuElements = document.querySelectorAll('.small-screen-form, .wide-screen-form')
    const visibleMenu = Array.from(menuElements).find(menu => 
      window.getComputedStyle(menu).display !== 'none'
    )

    if (!visibleMenu) return false

    const clearButton = document.createElement('button')
    clearButton.id = 'clear-all-favorites'
    clearButton.innerText = 'cleanup(dangerous)'
    clearButton.style.padding = '12px 16px'
    clearButton.style.backgroundColor = '#AB3B3A'
    clearButton.style.color = 'white'
    clearButton.style.border = 'none'
    clearButton.style.borderRadius = '18px'
    clearButton.style.cursor = 'pointer'
    clearButton.addEventListener('click', startClearingProcess)
    visibleMenu.appendChild(clearButton)

    // status bar
    statusDisplay = document.createElement('div')
    statusDisplay.id = 'clear-status'
    statusDisplay.style.margin = '10px'
    statusDisplay.style.padding = '5px'
    statusDisplay.style.backgroundColor = '#333'
    statusDisplay.style.color = 'white'
    statusDisplay.style.borderRadius = '3px'
    statusDisplay.style.display = 'none'
    visibleMenu.appendChild(statusDisplay)

    return true
  }

  // Add resize listener
  let resizeTimeout
  window.addEventListener('resize', () => {
    // Debounce the resize event
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(addClearButton, 250)
  })

  function startClearingProcess() {
    if (isProcessing) {
      alert('Starting...')
      return
    }

    isProcessing = true
    processedCount = 0
    currentIndex = 0 // reset index

    // get list's length
    const countText = document.querySelector('.metadata-stats')
    if (countText) {
      const match = countText.textContent.match(/\d+/)
      if (match) {
        totalVideos = parseInt(match[0], 10)
      }
    }

    if (!totalVideos) {
      totalVideos = document.querySelectorAll('ytd-playlist-video-renderer').length
    }

    statusDisplay.style.display = 'block'
    updateStatus(`Starting to clean the list, there are ${totalVideos} videos`)

    // start the clean
    clearVideoByIndex()
  }

  function updateStatus(message) {
    if (statusDisplay) {
      statusDisplay.textContent = message
    }
    console.log('%c[YouTube Favorites List Cleaner]', 'background: #77969A;color:white', message)
  }

  function clearVideoByIndex() {
    // query list item everytime
    const videos = document.querySelectorAll('ytd-playlist-video-renderer')

    if (videos.length === 0 || currentIndex >= videos.length) {
      // no videos in the list
      isProcessing = false
      updateStatus('All Deleted!')
      setTimeout(() => {
        statusDisplay.style.display = 'none'
      }, 2000)
      return
    }

    const currentVideo = videos[currentIndex]

    updateStatus(
      `Is Processing ${++processedCount} videos (index: ${currentIndex})，remaining: ${
        videos.length - currentIndex - 1
      }`,
    )

    const menuButton = currentVideo.querySelector('ytd-menu-renderer button')

    if (menuButton) {
      // click menu opener
      menuButton.click()

      setTimeout(() => {
        // get submenu items
        const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer')
        let removeOption = null

        for (const item of menuItems) {
          const text = item.textContent.trim().toLowerCase()
          if (text.includes('remove') || text.includes('移除')) {
            removeOption = item
            break
          }
        }

        if (removeOption) {
          // cta
          removeOption.click()

          // next()
          currentIndex++
          setTimeout(clearVideoByIndex, 100)
        } else {
          // no delete btn
          document.body.click()
          setTimeout(clearVideoByIndex, 100)
        }
      }, 1000)
    } else {
      // if no menu btn, skip (low possibility)
      updateStatus(`Cannot find index=${currentIndex}, try next...`)
      currentIndex++
      setTimeout(clearVideoByIndex, 1000)
    }
  }

  // loaded
  function waitForPage() {
    if (!addClearButton()) {
      setTimeout(waitForPage, 1000)
    }
  }

  // run
  waitForPage()
})()
