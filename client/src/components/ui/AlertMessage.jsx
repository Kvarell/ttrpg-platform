export default function AlertMessage({ type = "error", message }) {
    if (!message) return null;
  
    const styles = {
      error: "bg-red-50 border-red-200 text-red-700",
      success: "bg-green-100 border-green-400 text-[#164A41]",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800"
    };
  
    return (
      <div className={`mb-6 p-4 border rounded-lg ${styles[type] || styles.error}`}>
        <p>{message}</p>
      </div>
    );
  }