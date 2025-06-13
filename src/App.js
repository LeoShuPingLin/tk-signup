import React, { useState } from "react";
import { Card, Button } from "antd";
import SignupForm from "./SignupForm";
import QueryCancelView from "./QueryCancelView";
// 這裡加進管理元件
import ManagementView from "./ManagementView"; 

const HomePage = ({ onNav }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #ffe0c2 0%, #f8b500 100%)",
      padding: "70px 0",
    }}
  >
    <Card
      bordered={false}
      style={{
        maxWidth: 480,
        margin: "72px auto",
        borderRadius: 24,
        boxShadow: "0 8px 30px 0 rgba(168,120,0,0.13)",
        background: "#fffde7",
        border: "2.5px solid #ffe082",
        textAlign: "center"
      }}
      bodyStyle={{ padding: "48px 30px 38px 30px" }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, color: "#663c00", marginBottom: 32, letterSpacing: 2 }}>
        神話一三四團國戰
      </div>
      <Button
        type="primary"
        size="large"
        block
        style={{
          marginBottom: 28,
          background: "linear-gradient(90deg, #ff9800 0%, #ffb300 100%)",
          borderColor: "#ffb300",
          borderRadius: 12,
          fontSize: 20,
          fontWeight: "bold"
        }}
        onClick={() => onNav("signup")}
      >
        國戰報名
      </Button>
      <Button
        type="default"
        size="large"
        block
        style={{
          marginBottom: 24,
          background: "#ffecb3",
          borderRadius: 12,
          fontSize: 18,
          fontWeight: "bold",
          border: "1.5px solid #ffe082"
        }}
        onClick={() => onNav("manager")}
      >
        報名管理
      </Button>
      <Button
        type="default"
        size="large"
        block
        style={{
          background: "#ffe082",
          borderRadius: 12,
          fontSize: 18,
          fontWeight: "bold",
          border: "1.5px solid #ffd54f"
        }}
        onClick={() => onNav("query")}
      >
        查詢 / 取消報名
      </Button>
    </Card>
  </div>
);

const App = () => {
  const [page, setPage] = useState("home");
  const [defaultSignupName, setDefaultSignupName] = useState(null);

  // 讓查詢頁可以帶名子到報名
  const goSignupWithName = (name) => {
    setDefaultSignupName(name);
    setPage("signup");
  };

  // 每次進到報名頁，都重設 defaultSignupName 避免上一次殘留
  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    if (nextPage !== "signup") setDefaultSignupName(null);
  };

  let content;
  switch (page) {
    case "signup":
      content = (
        <>
          <Button
            onClick={() => handlePageChange("home")}
            style={{
              position: "fixed",
              top: 28,
              left: 28,
              zIndex: 50,
              background: "#fff3e0",
              border: "1.5px solid #ffd54f",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 17
            }}
          >← 回首頁</Button>
          <SignupForm defaultName={defaultSignupName} />
        </>
      );
      break;
    case "manager":
      content = (
        <>
          <Button
            onClick={() => handlePageChange("home")}
            style={{
              position: "fixed",
              top: 28,
              left: 28,
              zIndex: 50,
              background: "#fff3e0",
              border: "1.5px solid #ffd54f",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 17
            }}
          >← 回首頁</Button>
          {/* 這裡改成 ManagementView */}
          <ManagementView />
        </>
      );
      break;
    case "query":
      content = (
        <>
          <Button
            onClick={() => handlePageChange("home")}
            style={{
              position: "fixed",
              top: 28,
              left: 28,
              zIndex: 50,
              background: "#fff3e0",
              border: "1.5px solid #ffd54f",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 17
            }}
          >← 回首頁</Button>
          <QueryCancelView onGoSignup={goSignupWithName} />
        </>
      );
      break;
    default:
      content = <HomePage onNav={handlePageChange} />;
  }

  return content;
};

export default App;
