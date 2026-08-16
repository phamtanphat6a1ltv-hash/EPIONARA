import React, { useState } from 'react';
import CitationRenderer from '../components/CitationRenderer';

const mockAIResponse = `Công nghệ AI đang phát triển mạnh mẽ và ứng dụng vào nhiều lĩnh vực [1]. Trong y tế, AI giúp chuẩn đoán bệnh chính xác hơn thông qua phân tích hình ảnh và dữ liệu bệnh án [2].

Tại Việt Nam, nhiều bệnh viện lớn đã bắt đầu thử nghiệm các hệ thống AI để hỗ trợ bác sĩ [3]. Tuy nhiên, việc bảo mật dữ liệu người dùng và các rủi ro về mặt đạo đức vẫn là những thách thức cần được giải quyết trước khi áp dụng trên quy mô lớn [4].

SOURCES_START
[1] Tổng quan về Trí tuệ nhân tạo | TechDaily | https://example.com/ai-overview
[2] Ứng dụng AI trong y tế hiện đại | Tạp chí Y Học | https://example.com/ai-health
[3] Các bệnh viện Việt Nam áp dụng công nghệ số | VietnamNet | https://example.com/vn-health-tech
[4] Thách thức đạo đức khi sử dụng AI | AI Research | https://example.com/ai-ethics
SOURCES_END`;

export default function CitationDemoPage() {
  const [activeVariant, setActiveVariant] = useState('inline');
  
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Demo: Hiển Thị Trích Nguồn (Citations)</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
        Chọn một trong 4 phương án hiển thị để xem giao diện.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { id: 'inline', label: '1. Inline (Wikipedia/Perplexity)' },
          { id: 'cards', label: '2. Cards (Gemini/Bing)' },
          { id: 'sidepanel', label: '3. Side Panel' },
          { id: 'accordion', label: '4. Accordion (Mobile)' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setActiveVariant(v.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: activeVariant === v.id ? '#a78bfa' : 'rgba(255,255,255,0.1)',
              background: activeVariant === v.id ? 'rgba(167,139,250,0.15)' : 'transparent',
              color: activeVariant === v.id ? '#a78bfa' : 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: 16, 
        padding: 24 
      }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6c3de8, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            ✨
          </div>
          <div style={{ fontWeight: 600 }}>AI Assistant</div>
        </div>
        
        <CitationRenderer rawText={mockAIResponse} variant={activeVariant} />
      </div>
    </div>
  );
}
