import React, { useState } from "react";
import { Form, Input, Button, Slider, InputNumber, Row, Col, message, Card, Checkbox, Typography } from "antd";
import { supabase } from "./supabase";

const { Text } = Typography;

const App = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [battleCount, setBattleCount] = useState(1); // 參戰人數
  const [autoCount, setAutoCount] = useState(0);     // 放置人數

  // 當天日期，格式 yyyy-MM-dd
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const handleBattleChange = (val) => {
    setBattleCount(val);
    form.setFieldsValue({ battle_count: val });
  };
  const handleAutoChange = (val) => {
    setAutoCount(val);
    form.setFieldsValue({ auto_count: val });
  };

  const handleFinish = async (values) => {
    setLoading(true);
    // 產生2碼驗證碼
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let cancel_code = "";
    for (let i = 0; i < 2; i++) {
      cancel_code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const payload = {
      ...values,
      cancel_code,
      status: "N",
      actual_participated: false,
      applied_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("signups").insert([payload]);
    setLoading(false);
    if (error) {
      message.error("報名失敗：" + error.message);
    } else {
      message.success(`報名成功！請記下你的驗證碼：${cancel_code}`);
      form.resetFields();
      setBattleCount(1);
      setAutoCount(0);
    }
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
            國戰報名：{formattedDate}
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
            <Input size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontWeight: 500, color: "#784421" }}>參戰角色數</span>} required>
            <Row>
              <Col flex="auto">
                <Slider
                  min={1}
                  max={10}
                  value={battleCount}
                  onChange={handleBattleChange}
                  style={{ marginRight: 16 }}
                  trackStyle={{ backgroundColor: "#f57c00", height: 8 }}
                  handleStyle={{ backgroundColor: "#f57c00" }}  // 只改顏色
                  railStyle={{ backgroundColor: "#ffe0b2", height: 8 }}
                />
              </Col>
              <Col flex="80px">
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: "100%", borderRadius: 8 }}
                  value={battleCount}
                  onChange={handleBattleChange}
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
                  onChange={handleAutoChange}
                  style={{ marginRight: 16 }}
                  trackStyle={{ backgroundColor: "#43a047", height: 8 }}
                  handleStyle={{ backgroundColor: "#43a047" }}  // 只改顏色
                  railStyle={{ backgroundColor: "#dcedc8", height: 8 }}
                />
              </Col>
              <Col flex="80px">
                <InputNumber
                  min={0}
                  max={6}
                  style={{ width: "100%", borderRadius: 8 }}
                  value={autoCount}
                  onChange={handleAutoChange}
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
      </Card>
    </div>
  );
};

export default App;
