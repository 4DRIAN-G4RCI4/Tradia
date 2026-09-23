import { Router } from "express";
import { getNews, filterNewsByCoin } from "../services/news.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const coin = req.query.coin?.trim().slice(0, 100);
    const news = await getNews();
    if (!coin) {
      return res.json(news);
    }
    res.json(filterNewsByCoin(news, coin));
  } catch (err) {
    next(err);
  }
});

export default router;
