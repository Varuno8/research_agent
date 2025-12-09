import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { researchService } from './services/researchService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/plan', (req, res) => {
    try {
        const { query, sector } = req.body;
        const plan = researchService.makePlan(query, sector);
        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/approve', (req, res) => {
    try {
        const { plan_id, focus } = req.body;
        researchService.approve(plan_id, focus);
        res.json({ status: 'approved' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/run', (req, res) => {
    try {
        const { plan_id } = req.body;
        // Run asynchronously
        researchService.run(plan_id).catch(err => console.error("Run failed", err));
        res.json({ status: 'started' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/logs/:id', (req, res) => {
    try {
        const logs = researchService.getLogs(req.params.id);
        res.json(logs);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/api/report/:id', (req, res) => {
    try {
        const report = researchService.getReport(req.params.id);
        res.json({ report });
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

app.get('/api/plan/:id', (req, res) => {
    try {
        const plan = researchService.getPlan(req.params.id);
        res.json(plan);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
