import React, { useState, useEffect } from "react";
import { Form, Input, Button, Table, Select, Typography, Modal } from "antd";
import { supabase } from "./supabase"; // 引入 supabase 配置

const { Option } = Select;

const App = () => {
  const [groups, setGroups] = useState([]); // 團別選項
  const [members, setMembers] = useState([]); // 該團的 member 名單 (distinct)
  const [characters, setCharacters] = useState([]); // 當前選中 member 的 character
  const [selectedGroup, setSelectedGroup] = useState(null); // 當前選中的團別
  const [selectedMember, setSelectedMember] = useState(null); // 當前選中的成員
  const [tableData, setTableData] = useState([]); // 可編輯表格的數據
  const [statuses, setStatuses] = useState([]); // 參戰狀態選項
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // 從 ParaTable 獲取團別選項
  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("ParaTable")
        .select("para_no, para_name")
        .eq("para_type", "團別")
        .order("seq", { ascending: true });
      if (error) throw error;

      // 將結果轉換成下拉選單的格式
      setGroups(data.map((row) => ({ value: row.para_no, label: row.para_name })));
    } catch (error) {
      console.error("Error fetching groups: ", error);
    }
  };

  // Fetch 參戰狀態選項
  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("ParaTable")
        .select("para_no, para_name")
        .eq("para_type", "參戰狀態") // 過濾條件
        .order("para_no", { ascending: true }); // 排序
      if (error) throw error;

      // 格式化選項為 { value, label }
      setStatuses(data.map((status) => ({ value: status.para_no, label: status.para_name })));
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const fetchMembers = async (groupNo) => {
    try {
      const { data, error } = await supabase
        .from("MemberData")
        .select("member") // 查詢所有 member
        .eq("group", groupNo)// 過濾條件：根據團別
        .eq("status", "Y"); // 新增條件：status = 'Y'; 

      if (error) throw error;

      // 手動過濾 DISTINCT 的 member
      const distinctMembers = Array.from(new Set(data.map((row) => row.member)));

      console.log("Fetched Members:", distinctMembers); // 調試用
      setMembers(distinctMembers); // 更新成員列表
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  // 根據選中的成員載入其角色
  const fetchCharacters = async (member) => {
    try {
      const { data, error } = await supabase
        .from("MemberData")
        .select("id, group, member, character")
        .eq("member", member); // 根據成員過濾
      if (error) throw error;

      // 設定表格數據，每行顯示角色
      setTableData(data.map((row) => ({ id: row.id, group: row.group, member: row.member, character: row.character })));
    } catch (error) {
      console.error("Error fetching characters: ", error);
    }
  };

  // 初次載入團別選項
  useEffect(() => {
    fetchGroups();
    fetchStatuses();
  }, []);

  // 表格欄位定義
  const columns = [
    {
      title: "角色",
      dataIndex: "character",
      key: "character",
      render: (value, record, index) =>
        record.isEditable ? (
          <Input
            value={value}
            onChange={(e) => handleTableChange(e.target.value, index, "character")}
          />
        ) : (
          <span>{value}</span> // 唯讀模式顯示文字
        ),
    },
    {
      title: "參戰狀態",
      dataIndex: "status",
      key: "status",
      render: (value, record, index) => (
        <Select
          placeholder="選擇參戰狀態"
          value={value}
          onChange={(val) => handleTableChange(val, index, "status")}
          style={{ width: "100%" }}
        >
          {statuses.map((status) => (
            <Option key={status.value} value={status.value}>
              {status.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record, index) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button danger onClick={() => handleRemoveRow(index)}>
            刪除
          </Button>
        </div>
      ),
    },
  ];

  const handleTableChange = (value, index, field) => {
    const newData = [...tableData];
    newData[index][field] = value;

    // 如果是第一行且修改了參戰狀態，顯示自定義 Modal
    if (index === 0 && field === "status") {
      setSyncStatus(value); // 保存第一行的新狀態
      setIsModalVisible(true); // 顯示同步提示框
    }

    setTableData(newData); // 更新表格數據
  };

  // 移除表格行
  const handleRemoveRow = (index) => {
    const newData = [...tableData];
    newData.splice(index, 1);
    setTableData(newData);
  };

  // 新增一行表格
  const handleAddRow = () => {
    setTableData([
      ...tableData,
      { id: Date.now(), character: "", isEditable: true }, // 新增行默認可編輯
    ]);
  };

  // 團別變更處理
  const handleGroupChange = (value) => {
    setSelectedGroup(value);
    setSelectedMember(null);
    setTableData([]);
    fetchMembers(value); // 根據團別載入成員
  };

  // 成員變更處理
  const handleMemberChange = (value) => {
    setSelectedMember(value);
    fetchCharacters(value); // 根據成員載入角色
  };

  // 同步參戰狀態
  const handleSyncAll = () => {
    const newData = [...tableData];
    newData.forEach((row, i) => {
      if (i !== 0) {
        row.status = syncStatus; // 同步第一行的狀態
      }
    });
    setTableData(newData); // 更新表格數據
    setIsModalVisible(false); // 關閉 Modal
  };

  // 取消同步
  const handleCancelSync = () => {
    setIsModalVisible(false); // 僅關閉提示框
  };

  const handleConfirm = async () => {
    // 檢查是否所有行的狀態都已填寫
    const incompleteRow = tableData.find((row) => !row.status);
    if (incompleteRow) {
      alert("請確認所有角色的參戰狀態都已選擇！");
      return;
    }

    console.log('test2:', tableData);

    // 構造要插入 Supabase 的數據
    const rowsToInsert = tableData.map((row) => ({
      group: row.group, // 替換為實際的團別
      type: row.status,
      member: row.member, // 替換為實際的成員名稱
      character: row.character,
      status:'I'
    }));

    // 插入到 Supabase
    try {
      const { data, error } = await supabase.from("RowData").insert(rowsToInsert);

      if (error) {
        console.error("Error inserting data:", error);
        alert("報名失敗，請稍後再試！");
        return;
      }

      alert("報名成功！");
      setTableData([]); // 清空表格
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("報名失敗，請稍後再試！");
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
        團別與成員管理
      </Typography.Title>

      <Form layout="vertical">
        <Form.Item label="選擇團別" required>
          <Select
            placeholder="選擇團別"
            onChange={handleGroupChange}
            value={selectedGroup}
            style={{ width: "100%" }}
          >
            {groups.map((group) => (
              <Option key={group.value} value={group.value}>
                {group.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedGroup && (
          <Form.Item label="選擇成員" required>
            <Select
              placeholder="選擇成員"
              onChange={handleMemberChange}
              value={selectedMember}
              showSearch
              style={{ width: "100%" }}
              optionFilterProp="children"
            >
              {members.map((member) => (
                <Option key={member} value={member}>
                  {member}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
      </Form>

      {selectedMember && (
        <>
          <Typography.Title level={3}>編輯角色</Typography.Title>
          <Table
            dataSource={tableData}
            columns={columns}
            rowKey="id"
            pagination={false}
            bordered
          />
          {/* 發現會沒有該角色的對應，會有問題 先註解
          <Button
            type="dashed"
            onClick={handleAddRow}
            style={{ marginTop: 16, width: "100%" }}
          >
            新增角色
          </Button>
          */}
          <Button
            type="primary"
            onClick={handleConfirm}
            style={{ marginTop: 16, width: "100%" }}
          >
            報名
          </Button>
        </>
      )}
      <Modal
        title="同步參戰狀態"
        open={isModalVisible} // 使用狀態控制顯示
        onOk={handleSyncAll} // 確認同步所有行
        onCancel={handleCancelSync} // 僅關閉提示框
        okText="是，同步"
        cancelText="否，僅修改第一隻角色"
      >
        <p>您想要將第一隻角色的參戰狀態同步到其他角色嗎？</p>
      </Modal>
    </div>

  );
};

export default App;
