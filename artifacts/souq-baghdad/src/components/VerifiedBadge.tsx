import React from 'react';

export const VERIFIED_BADGE_SRC = "data:image/webp;base64,UklGRgIEAABXRUJQVlA4WAoAAAAQAAAAMQAAMQAAQUxQSKYBAAABkKNt27E599g2ummn+t0NFzArsBWntG27TjaQLdh2Uo7t+e7ge5/veb+ojQiHbdtIEjUF3JPM9ID/VpF9h9szTFld53YEbcWfJMmxfaW/lB2YIOmcsDRId4vXQqHri3TXayXuE1V9irNRR2U1Nm5q3bCQMaM1m6XXQXUdWpkdo3ojHZkawUvTtGrhVmOcx8AMfqIPfRqIk1ykTx0XhBy/OCHTTloY3XCZUrtN5yzMRYGPkkOmTr3VJqByVjUPGaNq64CsxxSMS9NwQOsokHSHkr0QlCzo3I4HzlOyWAap6yp304HtFF2DKKzxtgBodmRhpbW+umcuw1VAwxItXDe9BAqfGgNQPWmz0GWLpuXYr+MagPJv9LJULtlPockokPfAPQDeHRBkjFFqIgykiwMgf6Qs8ZbwPMBVy1vjMBVnG3VOm/bQq8mtpx2lbcIU+LfJAZgd98sx8Z7v9+dG6v0Nt57qZh2xuln9v71/xwvxJ71CqNWq9f81/RwHm3rNFbwRDgsvdh/sOu6QnDhQ7trv/eMknaNxsCyw7UxHljAa7Yf2BPG/ClZQOCA2AgAAMBAAnQEqMgAyAD4pEodDIaEKBQIADAFCWoAegX2b8cuGw7H/sB0fZQel/8J92+8Sf3HdAfo7+sHYA/SD2AP8B/K/Ui/u3WAfrh6If/S/0nwE/sT+y3wBfy7+q//nOPPkApubgBJgAlXnZBe/pIRZx5o63sPpGUgHoWAUXqMicwFJtTpXXF3hDKQAAP7/ifr8tQ45RO/zCfB7jP/2F6bAOq4w5V1kf8nVao1aq+vJVFJ27nwq9Xi/gEsb4pAF5rQzQL35kUXSOJbuQvrcL4LvihK0ABi10sp1QFLcIs54blIiKkqQv/UDxmY84rBKf/9Dv4uoA++Pf5YqxOcJYef4brTkFpT5GfwDMEBOW1l2uq/W5h6JIDLuvT6vr+nbh0LDs6ZN0NtAnBnUZ29riygDguJWkMJaCvT6mCnb0q2lEfOv9+20j1LG3QV80woccVfmpQJVq593Sfs2MrcaNK8G6Bh2AjHT2NqGAPFRhooTtC7KWUC/CUtOGky3+iR3/ijgwT7M8OPLpZwU2QwnSf/RFuCmUunlghekLUNrttlnk7obHeiccBX4Tjril8OSviotsjUXq6BD2oVuUBs+E/ufFvATx80IgLcJGUrw7+SQvj9cDeu5T/d/b9dL7l/I/hjXdp9i8RreXePNusNHMgwgtv/UNd7o8SiNSC3tlxuCLUPt7lrBsqDDDtOU2F5ksYoJesO1OaV1O3jKJ0w+ImzjShI0z+ClYzqIIqyvBV0n2zAAyMaAAAA=";

export const VerifiedBadge = ({ className = "w-4 h-4" }: { className?: string }) => {
  return (
    <img 
      alt="Verified" 
      className={`rms_img shrink-0 inline-block object-contain ${className}`} 
      src={VERIFIED_BADGE_SRC} 
    />
  );
};
