import React from 'react';
import { Box } from '@mui/material';
import LiveEditor from './LiveEditor';

interface GoogleDocEmbedProps {
  url?: string | null;
  height?: number;
  documentId?: number;
  editable?: boolean;
}

export default function GoogleDocEmbed({ 
  url, 
  height = 600, 
  documentId,
  editable = false 
}: GoogleDocEmbedProps) {
  // If documentId is provided, use the live editor
  if (documentId) {
    return (
      <LiveEditor
        documentId={documentId}
        url={url}
        height={height}
        editable={editable}
      />
    );
  }

  // Fallback to simple iframe for backward compatibility
  if (!url) return <Box sx={{ p: 2 }}>No document to display</Box>
  
  return (
    <Box sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
      <iframe 
        title="gdoc" 
        src={url} 
        style={{ width: '100%', height }} 
      />
    </Box>
  );
}
