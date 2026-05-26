import { motion } from 'motion/react';

function Card({ children, className = '', noPadding = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-lg border border-[#263142] bg-[#10151d]/92 shadow-[0_18px_55px_rgba(0,0,0,0.24)] backdrop-blur-sm ${className}`}
    >
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </motion.section>
  );
}

export default Card;
