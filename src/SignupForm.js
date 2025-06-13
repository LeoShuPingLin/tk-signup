import React, { useState, useEffect } from "react";
import { Form, Input, Button, Slider, InputNumber, Row, Col, Card, Checkbox, Typography, AutoComplete, message } from "antd";
import { supabase } from "./supabase";

const { Text } = Typography;

// 台灣時區 yyyy-MM-dd 取法
function getTaiwanDateString() {
  const now = new Date();
  // UTC+8, 台灣時間（不受主機時區影響）
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taiwanTime = new Date(utc + (8 * 60 * 60 * 1000));
  const yyyy = taiwanTime.getUTCFullYear();
  const mm = String(taiwanTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(taiwanTime.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const SignupForm = ({ defaultName }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [battleCount, setBattleCount] = useState(1);
  const [autoCount, setAutoCount] = useState(0);
  const [nameOptions, setNameOptions] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [showForm, setShowForm] = useState(true);

  const todayStr = getTaiwanDateString();

  // 載入所有角色名稱 (AutoComplete)
  useEffect(() => {
    const fetchNames = async () => {
      const { data, error } = await supabase.from("members").select("name");
      if (!error && data) {
        setNameOptions(data.map(row => ({ value: row.name })));
      }
    };
    fetchNames();
  }, []);

  // 預設帶入 defaultName
  useEffect(() => {
    if (defaultName) {
      setSelectedTag(defaultName);
      form.setFieldsValue({ name: defaultName });
    }
  }, [defaultName, form]);

  // 報名送出
  const handleFinish = async (values) => {
    setLoading(true);
    const inputName = values.name;

    // 1. 先查今日同名報名
    const { data: exist, error: checkError } = await supabase
      .from("signups")
      .select("id")
      .eq("name", inputName)
      .eq("applied_date", todayStr)
      .eq("status", "N")
      .maybeSingle();

    if (checkError) {
      message.error("查詢發生錯誤，請稍後再試。");
      setLoading(false);
      return;
    }
    if (exist) {
      message.error("同一天只能報名一次！");
      setLoading(false);
      return;
    }

    // 2. 組合 payload
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let cancel_code = "";
    for (let i = 0; i < 2; i++) {
      cancel_code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const payload = {
      ...values,
      name: inputName,
      cancel_code,
      status: "N",
      actual_participated: false,
      applied_date: todayStr,
    };

    // 3. 寫入
    const { error: insertError } = await supabase.from("signups").insert([payload]);
    setLoading(false);

    if (insertError) {
      message.error("報名失敗：" + insertError.message);
      return;
    }

    // 4. 成功才 reset + 顯示結果
    setSubmitResult({
      applied_date: todayStr,
      cancel_code,
      name: inputName,
      battle_count: values.battle_count,
      auto_count: values.auto_count,
    });
    setShowForm(false);
    form.resetFields();
    setBattleCount(1);
    setAutoCount(0);
    setSelectedTag("");
  };

  const handleAgain = () => {
    setShowForm(true);
    setSubmitResult(null);
    setBattleCount(1);
    setAutoCount(0);
    setSelectedTag("");
    form.resetFields();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #ffe0c2 0%, #f8b500 100%)",
        padding: "40px 0",
      }}
    >
      <Card
        title={
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#663c00",
              letterSpacing: 2,
              textShadow: "1px 2px 8px #fff7, 0 1px 0 #ffebee",
            }}
          >
            國戰報名：{todayStr}
          </span>
        }
        bordered={false}
        style={{
          maxWidth: 500,
          margin: "48px auto",
          boxShadow: "0 10px 40px 0 rgba(168,120,0,0.16)",
          borderRadius: 28,
          background: "#fffde7",
          border: "2.5px solid #ffe082",
        }}
        bodyStyle={{
          padding: 36,
          borderRadius: 28,
          minHeight: 560,
        }}
      >
        {/* 報名表單 */}
        {showForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{
              name: "",
              battle_count: 1,
              auto_count: 0,
              remark: "",
              is_self_team: false,
            }}
          >
            <Form.Item
              label={<span style={{ fontWeight: 500, color: "#784421" }}>主要角色名稱</span>}
              name="name"
              rules={[{ required: true, message: "請輸入你的角色名稱" }]}
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
            <Form.Item label={<span style={{ fontWeight: 500, color: "#784421" }}>參戰角色數</span>} required>
              <Row>
                <Col flex="auto">
                  <Slider
                    min={1}
                    max={10}
                    value={battleCount}
                    onChange={(val) => {
                      setBattleCount(val);
                      form.setFieldsValue({ battle_count: val });
                    }}
                    style={{ marginRight: 16 }}
                    trackStyle={{ backgroundColor: "#f57c00", height: 8 }}
                    handleStyle={{ backgroundColor: "#f57c00" }}
                    railStyle={{ backgroundColor: "#ffe0b2", height: 8 }}
                  />
                </Col>
                <Col flex="80px">
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: "100%", borderRadius: 8 }}
                    value={battleCount}
                    onChange={(val) => {
                      setBattleCount(val);
                      form.setFieldsValue({ battle_count: val });
                    }}
                    size="large"
                  />
                </Col>
              </Row>
              <Form.Item
                name="battle_count"
                initialValue={1}
                noStyle
                rules={[{ required: true }]}
              >
                <Input type="hidden" value={battleCount} />
              </Form.Item>
            </Form.Item>
            <Form.Item label={<span style={{ fontWeight: 500, color: "#784421" }}>放置角色數</span>} required>
              <Row>
                <Col flex="auto">
                  <Slider
                    min={0}
                    max={6}
                    value={autoCount}
                    onChange={(val) => {
                      setAutoCount(val);
                      form.setFieldsValue({ auto_count: val });
                    }}
                    style={{ marginRight: 16 }}
                    trackStyle={{ backgroundColor: "#43a047", height: 8 }}
                    handleStyle={{ backgroundColor: "#43a047" }}
                    railStyle={{ backgroundColor: "#dcedc8", height: 8 }}
                  />
                </Col>
                <Col flex="80px">
                  <InputNumber
                    min={0}
                    max={6}
                    style={{ width: "100%", borderRadius: 8 }}
                    value={autoCount}
                    onChange={(val) => {
                      setAutoCount(val);
                      form.setFieldsValue({ auto_count: val });
                    }}
                    size="large"
                  />
                </Col>
              </Row>
              <Form.Item
                name="auto_count"
                initialValue={0}
                noStyle
                rules={[{ required: true }]}
              >
                <Input type="hidden" value={autoCount} />
              </Form.Item>
            </Form.Item>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: "#784421" }}>是否自己一組</span>}
              name="is_self_team"
              valuePropName="checked"
            >
              <Checkbox style={{ fontSize: 16, color: "#6d4c41", fontWeight: 500 }}>
                是
              </Checkbox>
            </Form.Item>
            <Form.Item
              label={<span style={{ fontWeight: 500, color: "#784421" }}>備註</span>}
              name="remark"
            >
              <Input.TextArea
                rows={2}
                style={{
                  borderRadius: 10,
                  background: "#fffde7",
                  borderColor: "#ffe082"
                }}
                placeholder="其他說明 (可選)"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  background: "linear-gradient(90deg, #ff9800 0%, #ffb300 100%)",
                  borderColor: "#ffb300",
                  borderRadius: 12,
                  fontSize: 18,
                  fontWeight: "bold",
                  boxShadow: "0 2px 12px #ff980044",
                }}
                size="large"
              >
                送出報名
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* 報名完成後顯示區塊 */}
        {!showForm && submitResult && (
          <Card
            type="inner"
            title={<span style={{ color: "#ff9800", fontWeight: 700, fontSize: 20 }}>報名完成！</span>}
            style={{
              marginTop: 28,
              borderRadius: 16,
              background: "#fffbe9",
              border: "1.5px solid #ffecb3",
              boxShadow: "0 2px 8px #ffecb322",
              textAlign: "center"
            }}
            bodyStyle={{ fontSize: 17, lineHeight: 2, minHeight: 140 }}
          >
            {submitResult.error ? (
              <Text type="danger">{submitResult.error}</Text>
            ) : (
              <div>
                <div>報名日期：<b>{submitResult.applied_date}</b></div>
                <div>驗證碼：<b style={{ color: "#e65100", letterSpacing: 3, fontSize: 24 }}>{submitResult.cancel_code}</b></div>
                <div>角色名稱：<b>{submitResult.name}</b></div>
                <div>參戰角色數：<b>{submitResult.battle_count}</b></div>
                <div>放置角色數：<b>{submitResult.auto_count}</b></div>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    marginTop: 30,
                    background: "linear-gradient(90deg, #ff9800 0%, #ffb300 100%)",
                    borderColor: "#ffb300",
                    borderRadius: 8,
                    fontWeight: "bold"
                  }}
                  onClick={handleAgain}
                >
                  再報一隻
                </Button>
              </div>
            )}
          </Card>
        )}
      </Card>
    </div>
  );
};

export default SignupForm;
