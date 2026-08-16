import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CitationRenderer.module.css';

// SVG Icons
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const BookOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function CitationRenderer({ rawText, variant = 'inline' }) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // 1. Parsing Logic
  const sourceStartIdx = rawText.indexOf("SOURCES_START");
  const sourceEndIdx = rawText.indexOf("SOURCES_END");
  
  let content = rawText;
  let sources = [];

  if (sourceStartIdx !== -1 && sourceEndIdx !== -1) {
    content = rawText.slice(0, sourceStartIdx).trim();
    const sourcesText = rawText.slice(sourceStartIdx + "SOURCES_START".length, sourceEndIdx).trim();
    
    const sourceLines = sourcesText.split('\n').filter(line => line.trim());
    sources = sourceLines.map(line => {
        // [1] Title | Publisher | URL
        const match = line.match(/^\[(\d+)\]\s+(.+?)\s+\|\s+(.+?)\s+\|\s+(.+)$/);
        if (match) {
           return {
              id: match[1],
              title: match[2].trim(),
              publisher: match[3].trim(),
              url: match[4].trim()
           };
        }
        return null;
    }).filter(Boolean);
  }

  // 2. Text Renderer (Converts [1] to inline links and handles paragraphs)
  const renderText = () => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((p, pIndex) => {
      // Split by [id]
      const parts = p.split(/(\[\d+\])/g);
      
      return (
        <p key={pIndex} className={styles.paragraph}>
          {parts.map((part, i) => {
            const match = part.match(/^\[(\d+)\]$/);
            if (match) {
              const sourceId = match[1];
              const sourceInfo = sources.find(s => s.id === sourceId);
              
              if (sourceInfo && (variant === 'inline' || variant === 'cards' || variant === 'sidepanel' || variant === 'accordion')) {
                 return (
                    <a 
                       key={i} 
                       href={sourceInfo.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className={styles.inlineCitation}
                    >
                       [{sourceId}]
                       {variant === 'inline' && (
                         <span className={styles.tooltip}>
                            <span className={styles.tooltipTitle}>{sourceInfo.title}</span>
                            <span className={styles.tooltipPublisher}>{sourceInfo.publisher}</span>
                         </span>
                       )}
                    </a>
                 );
              }
              return part;
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {renderText()}
      </div>

      {/* Variant 2: Cards */}
      {variant === 'cards' && sources.length > 0 && (
        <div className={styles.cardsContainer}>
          {sources.map(s => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.sourceCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>{s.id}</span>
                <span className={styles.cardPublisher}>{s.publisher}</span>
              </div>
              <div className={styles.cardTitle}>{s.title}</div>
            </a>
          ))}
        </div>
      )}

      {/* Variant 3: Side Panel */}
      {variant === 'sidepanel' && sources.length > 0 && (
        <>
          <button className={styles.sidePanelBtn} onClick={() => setIsSidePanelOpen(true)}>
            <BookOpen /> Xem {sources.length} nguồn tham khảo
          </button>
          
          <AnimatePresence>
            {isSidePanelOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className={styles.panelOverlay} 
                  onClick={() => setIsSidePanelOpen(false)}
                />
                <motion.div 
                  initial={{ x: '100%' }} 
                  animate={{ x: 0 }} 
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={styles.sidePanel}
                >
                  <div className={styles.panelHeader}>
                    <div className={styles.panelTitle}>
                      <BookOpen /> Nguồn tham khảo
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsSidePanelOpen(false)}>
                      <XIcon />
                    </button>
                  </div>
                  <div className={styles.panelContent}>
                    {sources.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.panelItem}>
                        <div className={styles.panelItemPublisher}>{s.publisher}</div>
                        <div className={styles.panelItemTitle}>{s.title}</div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Variant 4: Accordion */}
      {variant === 'accordion' && sources.length > 0 && (
        <div className={styles.accordionContainer}>
          <button className={styles.accordionHeader} onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LinkIcon /> Xem {sources.length} nguồn tham khảo
            </span>
            <span className={`${styles.accordionIcon} ${isAccordionOpen ? styles.open : ''}`}>
              <ChevronDown />
            </span>
          </button>
          <AnimatePresence>
             {isAccordionOpen && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 style={{ overflow: 'hidden' }}
               >
                 <div className={styles.accordionContent}>
                    {sources.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.accordionItem}>
                        <span className={styles.cardNumber}>{s.id}</span>
                        <div className={styles.accordionItemTitle}>{s.title}</div>
                        <LinkIcon />
                      </a>
                    ))}
                 </div>
               </motion.div>
             )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
