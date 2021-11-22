import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import cl from "classnames";
import "./style.css";

const tabs = [
  {
    key: "all",
    name: "全部",
  },
  {
    key: "good",
    name: "精华",
  },
  {
    key: "share",
    name: "分享",
  },
  {
    key: "ask",
    name: "问答",
  },
  {
    key: "job",
    name: "招聘",
  },
];

interface Author {
  avatar_url: string;
}
export interface Topic {
  title: string;
  id: string;
  content: string;
  create_at: string;
  author: Author;
}

function App() {
  const [data, setData] = useState<Topic[]>([]);
  const [tab, setTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [current, setCurrent] = useState("");
  useEffect(() => {
    fetch(`${apiBaseUrl}api/v1/topics?page=${page}&tab=${tab}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setData(data.data);
          setLoading(false);
        }
      });
  }, [page, tab]);

  const handleClick = (item: Topic) => {
    console.log(item);
    setCurrent(item.id);

    tsvscode.postMessage({ type: "detail", value: item });
  };

  const handleSetTab = (tab: string) => {
    setTab(tab);
    setPage(1);
  };

  return (
    <div>
      <div className="flex space-x-2 py-2 border-b">
        {tabs.map((tb) => (
          <button
            onClick={() => handleSetTab(tb.key)}
            className={cl(
              "inline-flex text-center text-white border-0 py-1 px-3 focus:outline-none hover:bg-blue-600 rounded-sm",
              {
                "bg-blue-500": tab == tb.key,
              }
            )}
          >
            {tb.name}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-3">loading...</div>
      ) : (
        <>
          <ul className="mt-2">
            {data.map((item) => (
              <li
                className={cl(
                  "px-3 py-2 hover:bg-gray-600 flex cursor-pointer",
                  {
                    "bg-gray-500": current === item.id,
                  }
                )}
                onClick={() => handleClick(item)}
                key={item.id}
              >
                <img
                  className="rounded w-8 h-8 inline-block mr-2"
                  src={item.author.avatar_url}
                  alt="Image"
                />
                <div className="flex-auto">
                  <div>{item.title}</div>
                  <span className="opacity-70">
                    {new Date(item.create_at).toLocaleDateString()}
                    {new Date(item.create_at).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center py-5">
            <span>
              当前第 <span className="text-blue-500">{page}</span> 页
            </span>
            <button
              className="inline-flex text-center text-white bg-blue-500 border-0 py-1 px-3 focus:outline-none hover:bg-blue-600 rounded-sm"
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}

render(<App />, document.getElementById("root"));
