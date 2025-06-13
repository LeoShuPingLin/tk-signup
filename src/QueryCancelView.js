import React, { useState, useEffect } from "react";
import { Card, Button, Form, AutoComplete, Input, Typography, message, Modal } from "antd";
import { supabase } from "./supabase";

const { Text } = Typography;

const QueryCancelView = ({ onGoSignup }) => {
  const [form] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [nameOptions, setNameOptions] = useState([]);
  const [selectedTag, setSelectedTag] = useState(""); // 查詢用字串
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null); // 報名查詢結果
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // 載入角色名（AutoComplete用）
  useEffect(() => {
    const fetchNames = async () => {
      const { data, error } = await supabase.from("members").select("name");
      if (!error && data) {
        setNameOptions(data.map(row => ({ value: row.name })));
      }
    };
    fetchNames();
  }, []);

  // 查詢報名 (只查 status='N')
  const handleFinish = async (values) => {
    setQuerying(true);
    setResult(null);
    const inputName = values.name;
    const { data, error } = await supabase
      .from("signups")
      .select("*")
      .eq("name", inputName)
      .eq("status", "N") // 只查有效報名
      .maybeSingle();
    setQuerying(false);

    if (error) {
      setResult({ error: error.message });
      return;
    }
    if (!data) {
      // 查無資料或已取消，跳去報名頁 &帶角色名
      Modal.confirm({
        title: "尚未報名",
        content: `角色「${inputName}」尚未完成報名，是否要直接前往報名？`,
        okText: "前往報名",
        cancelText: "取消",
        onOk: () => {
          onGoSignup(inputName);
        }
      });
    } else {
      setResult({
        ...data,
        name: data.name,
        battle_count: data.battle_count,
        auto_count: data.auto_count,
        status: data.status,
        cancel_code: data.cancel_code,
        id: data.id,
      });
      setShowCancel(false);
    }
  };

  // 送出取消（需驗證碼，把 status N 改 C）
  const handleCancel = async (values) => {
    setCancelLoading(true);
    // 驗證碼驗證
    const { data, error } = await supabase
      .from("signups")
      .select("*")
      .eq("id", result.id)
      .eq("cancel_code", values.cancel_code)
      .eq("status", "N")
      .maybeSingle();
    if (error || !data) {
      setCancelLoading(false);
      message.error("驗證碼錯誤，無法取消報名！");
      return;
    }
    // 正確則取消
    const { error: updateError } = await supabase
      .from("signups")
      .update({ status: "C" })
      .eq("id", result.id);
    setCancelLoading(false);
    if (updateError) {
      message.error("取消失敗：" + updateError.message);
    } else {
      message.success("已成功取消報名！");
      setResult(null); // 取消後視同未報名，自動回到查詢畫面
      setShowCancel(false);
    }
    cancelForm.resetFields();
  };

  // 查詢表單 & 顯示
  return (
    <Card
      style={{
        maxWidth: 480,
        margin: "56px auto",
        borderRadius: 18,
        textAlign: "center",
        minHeight: 200,
      }}
    >
      <h2>查詢 / 取消報名狀態</h2>
      {!result ? (
        <>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            style={{ maxWidth: 350, margin: "32px auto" }}
          >
            <Form.Item
              label="角色名稱"
              name="name"
              rules={[{ required: true, message: "請輸入角色名稱" }]}
            >
              <AutoComplete
                options={nameOptions}
                value={selectedTag}
                onChange={(value) => {
                  setSelectedTag(value);
                  form.setFieldsValue({ name: value });
                }}
                allowClear
                placeholder="請輸入或選擇角色名稱"
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={querying}
              block
              style={{
                background: "linear-gradient(90deg, #ff9800 0%, #ffb300 100%)",
                borderRadius: 10,
                fontWeight: "bold",
                fontSize: 18,
                marginTop: 8
              }}
            >
              查詢
            </Button>
          </Form>
        </>
      ) : (
        // 查到結果顯示卡片
        <Card
          type="inner"
          title={<span style={{ color: "#ff9800", fontWeight: 700, fontSize: 20 }}>報名資訊</span>}
          style={{
            marginTop: 18,
            borderRadius: 14,
            background: "#fffbe9",
            border: "1.5px solid #ffecb3",
            boxShadow: "0 2px 8px #ffecb322",
            textAlign: "center"
          }}
          bodyStyle={{ fontSize: 17, lineHeight: 2, minHeight: 140 }}
        >
          <div>角色名稱：<b>{result.name}</b></div>
          <div>參戰角色數：<b>{result.battle_count}</b></div>
          <div>放置角色數：<b>{result.auto_count}</b></div>
          <div>狀態：{result.status === "N" ? <Text type="success">已報名</Text> : <Text type="danger">已取消</Text>}</div>
          {result.status === "N" && (
            <>
              {!showCancel ? (
                <Button
                  type="primary"
                  danger
                  style={{
                    marginTop: 30,
                    background: "#fff1e0",
                    color: "#d32f2f",
                    border: "1.5px solid #ffd54f",
                    borderRadius: 8,
                    fontWeight: "bold"
                  }}
                  onClick={() => setShowCancel(true)}
                >
                  取消報名
                </Button>
              ) : (
                <Form
                  form={cancelForm}
                  layout="inline"
                  onFinish={handleCancel}
                  style={{ marginTop: 24, justifyContent: "center", display: "flex" }}
                >
                  <Form.Item
                    name="cancel_code"
                    rules={[{ required: true, message: "請輸入驗證碼" }]}
                  >
                    <Input
                      placeholder="驗證碼"
                      maxLength={2}
                      style={{ width: 90, letterSpacing: 2, textAlign: "center", fontSize: 18 }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={cancelLoading}
                      danger
                    >
                      確認取消
                    </Button>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      onClick={() => {
                        setShowCancel(false);
                        cancelForm.resetFields();
                      }}
                    >
                      返回
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </>
          )}
        </Card>
      )}
    </Card>
  );
};

export default QueryCancelView;
