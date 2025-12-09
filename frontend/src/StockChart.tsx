import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
    data: { date: string; price: number }[];
    ticker: string;
}

const StockChart = ({ data, ticker }: ChartProps) => {
    return (
        <div style={{ width: '100%', height: 300, marginBottom: '2rem' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>{ticker} - 1 Year Price History</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--text-secondary)"
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`;
                        }}
                    />
                    <YAxis stroke="var(--text-secondary)" domain={['auto', 'auto']} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: '#8884d8' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} dot={false} name="Close Price" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockChart;
