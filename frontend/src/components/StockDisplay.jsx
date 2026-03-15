// Reusable StockDisplay component that shows available stock (accounting for draft orders)
import { useAvailableStock } from '../hooks/useAvailableStock';

const StockDisplay = ({ 
  item, 
  warehouse, 
  isSelected = false, 
  className = "",
  showLabel = true,
  labelText = "Available",
  options = {}
}) => {
  const { stock, loading, isAvailableStock } = useAvailableStock(item, warehouse, options);

  if (loading) {
    return (
      <div className={`${className}`}>
        {showLabel && (
          <div className={`text-xs ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
            {labelText}
          </div>
        )}
        <div className={`text-sm font-medium mt-0.5 ${isSelected ? "text-white" : "text-[#6b7280]"}`}>
          Loading...
        </div>
      </div>
    );
  }

  const displayStock = stock || 0;
  const isOutOfStock = displayStock <= 0;

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className={`text-xs ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
          {labelText} {isAvailableStock ? "(Updated)" : ""}
        </div>
      )}
      <div className={`text-sm font-medium mt-0.5 ${
        isSelected 
          ? "text-white" 
          : isOutOfStock 
            ? "text-[#ef4444]" 
            : isAvailableStock 
              ? "text-[#059669]" 
              : "text-[#f59e0b]"
      }`}>
        {displayStock.toFixed(2)} pcs
        {!isAvailableStock && (
          <span className="text-[10px] block">
            (Total)
          </span>
        )}
      </div>
    </div>
  );
};

export default StockDisplay;