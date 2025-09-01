import React, { useState, useEffect } from 'react';

const TextType = ({ 
  text, 
  typingSpeed = 75, 
  deletingSpeed = 50, 
  pauseDuration = 1500, 
  showCursor = true, 
  cursorCharacter = "|",
  cursorBlinkDuration = 0.5,
  variableSpeed = false,
  variableSpeedMin = 60,
  variableSpeedMax = 100
}) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursorState, setShowCursorState] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursorState(prev => !prev);
    }, cursorBlinkDuration * 1000);

    return () => clearInterval(cursorInterval);
  }, [cursorBlinkDuration]);

  useEffect(() => {
    if (!text || text.length === 0) return;

    const currentString = text[currentIndex];
    
    if (!isDeleting) {
      // Typing
      if (currentText.length < currentString.length) {
        const speed = variableSpeed 
          ? Math.random() * (variableSpeedMax - variableSpeedMin) + variableSpeedMin
          : typingSpeed;
          
        const timer = setTimeout(() => {
          setCurrentText(currentString.slice(0, currentText.length + 1));
        }, speed);
        
        return () => clearTimeout(timer);
      } else {
        // Finished typing, pause then start deleting
        const timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Deleting
      if (currentText.length > 0) {
        const timer = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, deletingSpeed);
        
        return () => clearTimeout(timer);
      } else {
        // Finished deleting, move to next string
        setIsDeleting(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
      }
    }
  }, [currentText, currentIndex, isDeleting, text, typingSpeed, deletingSpeed, pauseDuration, variableSpeed, variableSpeedMin, variableSpeedMax]);

  return (
    <span className="inline-block">
      {currentText}
      {showCursor && showCursorState && (
        <span className="animate-pulse">{cursorCharacter}</span>
      )}
    </span>
  );
};

export default TextType;
