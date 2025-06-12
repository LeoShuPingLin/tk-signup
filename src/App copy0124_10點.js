import React, { useState, useEffect } from "react";
import { Form, Input, Button, Table, Select, Typography, Space } from "antd";
import { supabase } from "./supabase"; // 引入 supabase 配置

const { Option } = Select;

const App = () => {
  const [registrations, setRegistrations] = useState([]);
  const [groups, setGroups] = useState([]); // 團別選項
  const [statuses, setStatuses] = useState([]); // 參戰狀態選項

  // 表格的欄位定義
  const columns = [
    {
      title: "角色名稱",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "團別",
      dataIndex: "group",
      key: "group",
    },
    {
      title: "參戰狀態",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "備註",
      dataIndex: "notes",
      key: "notes",
    },
  ];

  // 獲取資料
  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase.from("RowData").select("*");
      if (error) throw error;
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching registrations: ", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("ParaTable")
        .select("para_no, para_name")
        .eq("para_type", "團別")
        .order("seq", { ascending: true });
      if (error) throw error;
      setGroups(data.map((group) => ({ value: group.para_no, label: group.para_name })));
    } catch (error) {
      console.error("Error fetching groups: ", error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("ParaTable")
        .select("para_no, para_name")
        .eq("para_type", "參戰狀態")
        .order("seq", { ascending: true });
      if (error) throw error;

      // 格式化資料為 { value, label }
      setStatuses(data.map((status) => ({ value: status.para_no, label: status.para_name })));
    } catch (error) {
      console.error("Error fetching statuses: ", error);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchGroups();
    fetchStatuses();
  }, []);

  // 新增資料
  const onFinish = async (values) => {
    const formData = {
      name: values.name,
      group: values.group,
      status: values.status,
      notes: values.notes || "",
    };

    try {
      const { data, error } = await supabase.from("RowData").insert([formData]);
      if (error) throw error;
      alert("新增成功！");
      fetchRegistrations();
    } catch (error) {
      alert("新增失敗：" + error.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <Typography.Title level={2} style={{ textAlign: "center" }}>
        角色新增表單
      </Typography.Title>

      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="角色名稱"
          name="name"
          rules={[{ required: true, message: "請輸入角色名稱！" }]}
        >
          <Input placeholder="輸入角色名稱" />
        </Form.Item>

        <Form.Item
          label="團別"
          name="group"
          rules={[{ required: true, message: "請選擇團別！" }]}
        >
          <Select placeholder="選擇團別">
            {groups.map((group) => (
              <Option key={group.value} value={group.value}>
                {group.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="參戰狀態"
          name="status"
          rules={[{ required: true, message: "請選擇參戰狀態！" }]}
        >
          <Select placeholder="選擇參戰狀態">
            {statuses.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="備註" name="notes">
          <Input.TextArea placeholder="輸入備註" rows={3} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
            新增角色
          </Button>
        </Form.Item>
      </Form>

      <Typography.Title level={3} style={{ marginTop: "30px" }}>
        已新增角色
      </Typography.Title>

      <Table
        dataSource={registrations}
        columns={columns}
        rowKey={(record) => record.id}
        bordered
      />
    </div>
  );
};

export default App;
