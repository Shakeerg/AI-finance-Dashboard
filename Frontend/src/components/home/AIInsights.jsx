export default function AIInsights() {

  const transactions = [
    {
      merchant: "Swiggy",
      amount: "-₹840",
      category: "Food"
    },
    {
      merchant: "Amazon",
      amount: "-₹1,260",
      category: "Shopping"
    },
    {
      merchant: "Indian Oil",
      amount: "-₹2,000",
      category: "Fuel"
    },
    {
      merchant: "Electricity",
      amount: "-₹1,450",
      category: "Bills"
    }
  ];

  return (

    <section
      id="insights"
      className="section"
    >

      <div className="container">

        <p className="eyebrow">
          AI INSIGHTS
        </p>

        <h2>
          Understand your spending.
          <br />
          Instantly.
        </h2>

        <div className="analytics-layout">

          {/* LEFT */}
          <div className="analytics-card" data-aos="fade-right">

            <h3>Monthly Breakdown</h3>

            <div className="progress-circle">
              78%
            </div>

            <div className="category-list">

              <div className="category">
                <span>🍔 Food</span>
                <strong>₹4,300</strong>
              </div>

              <div className="category">
                <span>🛒 Shopping</span>
                <strong>₹2,100</strong>
              </div>

              <div className="category">
                <span>⛽ Fuel</span>
                <strong>₹1,400</strong>
              </div>

              <div className="category">
                <span>💡 Bills</span>
                <strong>₹3,700</strong>
              </div>

            </div>

          </div>

          {/* RIGHT */}

          {/* RIGHT */}
          <div className="analytics-card" data-aos="fade-left">

            <h3>Recent Transactions</h3>

            <div className="transaction-list">

              {transactions.map((item,index)=>(

                <div
                  className="transaction"
                  key={index}
                >

                  <div>

                    <strong>{item.merchant}</strong>

                    <p>{item.category}</p>

                  </div>

                  <span>{item.amount}</span>

                </div>

              ))}

            </div>

            <div className="ai-recommendation">

              <h4>Gemini Recommendation</h4>

              <p>

                You spent <strong>18%</strong> more on food this month.

                Reducing food delivery twice a week could save

                <strong> ₹2,000/month.</strong>

              </p>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}