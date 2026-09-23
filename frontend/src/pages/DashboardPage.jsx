import { useState } from "react";
import MarketStatsRow from "../components/MarketStatsRow";
import TickerTape from "../components/TickerTape";
import CryptoList from "../components/CryptoList";
import AddCoinPanel from "../components/AddCoinPanel";
import CryptoChart from "../components/CryptoChart";
import CurrencyConverter from "../components/CurrencyConverter";
import AiAnalysisPanel from "../components/AiAnalysisPanel";

export default function DashboardPage({ searchQuery }) {
  const [selectedCoinId, setSelectedCoinId] = useState("bitcoin");
  const [chartDays, setChartDays] = useState(7);

  return (
    <>
      <MarketStatsRow />
      <TickerTape onSelectCoin={setSelectedCoinId} />
      <AddCoinPanel />

      <main className="layout">
        <div className="left-column">
          <CryptoList
            selectedCoinId={selectedCoinId}
            onSelectCoin={setSelectedCoinId}
            searchQuery={searchQuery}
          />
        </div>
        <div className="right-column">
          <CurrencyConverter />
          <CryptoChart coinId={selectedCoinId} days={chartDays} onDaysChange={setChartDays} />
          <AiAnalysisPanel coinId={selectedCoinId} />
        </div>
      </main>
    </>
  );
}
